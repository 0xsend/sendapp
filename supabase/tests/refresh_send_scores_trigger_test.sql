SET client_min_messages TO NOTICE;

-- Verify that the DEFERRABLE constraint trigger refresh_send_scores_on_first_transfer
-- refreshes the MV exactly once across multiple transactions, then skips.
-- Pattern inspired by existing tests:
-- - supabase/tests/distributions_test.sql (uses basejump helpers, plan(), service_role)
-- - supabase/tests/tag_referrals_test.sql (seed data and assertions)

SELECT plan(3);
CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";
SELECT set_config('role', 'service_role', TRUE);

-- 1) Seed minimal accounts (addresses in bytea for send_token_transfers)
--    and optional send_accounts (not strictly required for this test)
--    Using deterministic hex so we can reference easily
INSERT INTO public.send_account_created(
  chain_id, log_addr, block_time, user_op_hash, tx_hash, account, ig_name, src_name, block_num, tx_idx, log_idx
) VALUES
  (1, '\x0000000000000000000000000000000000000001', extract(epoch from (now() at time zone 'UTC')), '\x1111', '\xaaaa', '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'test', 'test', 1, 0, 0),
  (1, '\x0000000000000000000000000000000000000002', extract(epoch from (now() at time zone 'UTC')), '\x2222', '\xbbbb', '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'test', 'test', 2, 0, 0)
ON CONFLICT DO NOTHING;

INSERT INTO public.send_accounts(user_id, address, chain_id, init_code)
VALUES
  (tests.create_supabase_user('refresh_trigger_user_1'), '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 1, '\x00'),
  (tests.create_supabase_user('refresh_trigger_user_2'), '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 1, '\x00')
ON CONFLICT DO NOTHING;

-- 2) Create a closed previous distribution (prev_no) and an active one (active_no)
--    Ensure (merkle_drop_addr, tranche_id) uniqueness satisfied.
DO $$
DECLARE
  prev_no int := 100100;
  active_no int := 100101;
BEGIN
  -- prev closed
  INSERT INTO public.distributions(
    number, amount, hodler_pool_bips, bonus_pool_bips, fixed_pool_bips,
    name, description, qualification_start, qualification_end, claim_end,
    hodler_min_balance, chain_id, token_addr, token_decimals, tranche_id, earn_min_balance
  ) VALUES (
    prev_no, 1000000000, 5000, 1000, 500,
    'Prev for refresh test', 'closed prev',
    (now() at time zone 'UTC') - interval '2 hours',
    (now() at time zone 'UTC') - interval '1 hour',
    (now() at time zone 'UTC') + interval '7 days',
    0, 1, '\xcccccccccccccccccccccccccccccccccccccccc', 18, 800001, 0
  ) ON CONFLICT (merkle_drop_addr, tranche_id) DO NOTHING;

  -- active covering now
  INSERT INTO public.distributions(
    number, amount, hodler_pool_bips, bonus_pool_bips, fixed_pool_bips,
    name, description, qualification_start, qualification_end, claim_end,
    hodler_min_balance, chain_id, token_addr, token_decimals, tranche_id, earn_min_balance
  ) VALUES (
    active_no, 1000000000, 5000, 1000, 500,
    'Active for refresh test', 'active dist',
    (now() at time zone 'UTC') - interval '15 minutes',
    (now() at time zone 'UTC') + interval '45 minutes',
    (now() at time zone 'UTC') + interval '7 days',
    0, 1, '\xdddddddddddddddddddddddddddddddddddddddd', 18, 800002, 0
  ) ON CONFLICT (merkle_drop_addr, tranche_id) DO NOTHING;
END$$;

-- FK prerequisites for paths exercised by triggers
--  a) tag_registration (called from the DEFERRABLE trigger)
INSERT INTO public.distribution_verification_values(
  type, fixed_value, bips_value, distribution_id, multiplier_min, multiplier_max, multiplier_step
)
SELECT 'tag_registration', 0, 0, id, 1.0, 1.0, 0.0
FROM public.distributions
WHERE number = 100101
ON CONFLICT DO NOTHING;

--  b) AFTER triggers reference types send_ten, send_one_hundred, send_streak
INSERT INTO public.distribution_verification_values(
  type, fixed_value, bips_value, distribution_id, multiplier_min, multiplier_max, multiplier_step
)
SELECT v.type, 0, 0, d.id, 1.0, 1.0, 0.0
FROM public.distributions d
JOIN (VALUES
  ('send_ten'::public.verification_type),
  ('send_one_hundred'::public.verification_type),
  ('send_streak'::public.verification_type)
) AS v(type) ON TRUE
WHERE d.number = 100101
ON CONFLICT DO NOTHING;

-- 3) Reset statement stats, assert no refresh calls yet
SELECT pg_stat_statements_reset();
SELECT is(
  (
    SELECT coalesce(SUM(calls),0)::bigint
    FROM pg_stat_statements
    WHERE query ILIKE 'refresh materialized view private.send_scores_history%'
  ), 0::bigint, 'No refresh calls before test'
);

-- 5) Transaction 1: insert a transfer within the active window; commit to fire DEFERRABLE trigger
BEGIN;
INSERT INTO public.send_token_transfers(
  chain_id, log_addr, block_time, tx_hash, f, t, v, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx
) VALUES (
  1,
  '\x01020304',
  extract(epoch from (now() at time zone 'UTC')),
  '\x' || encode(gen_random_bytes(16),'hex')::text::bytea,
  '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  1111,
  'test', 'test', floor(extract(epoch from clock_timestamp())*1000000)::bigint, 0, 0, 0
);
COMMIT;

-- Assert exactly one refresh call occurred
SELECT is(
  (
    SELECT coalesce(SUM(calls),0)::bigint
    FROM pg_stat_statements
    WHERE query ILIKE 'refresh materialized view private.send_scores_history%'
  ), 1::bigint, 'Exactly one refresh after first commit'
);

-- 6) Transaction 2: insert another transfer; NOT EXISTS should be false now; no new refresh
BEGIN;
INSERT INTO public.send_token_transfers(
  chain_id, log_addr, block_time, tx_hash, f, t, v, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx
) VALUES (
  1,
  '\x05040302',
  extract(epoch from (now() at time zone 'UTC')),
  '\x' || encode(gen_random_bytes(16),'hex')::text::bytea,
  '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  2222,
  'test', 'test', floor(extract(epoch from clock_timestamp())*1000000)::bigint + 1, 0, 0, 0
);
COMMIT;

SELECT is(
  (
    SELECT coalesce(SUM(calls),0)::bigint
    FROM pg_stat_statements
    WHERE query ILIKE 'refresh materialized view private.send_scores_history%'
  ), 1::bigint, 'Still one refresh after second commit (gating works)'
);

-- Re-enable triggers we disabled
ALTER TABLE public.send_token_transfers ENABLE TRIGGER "filter_send_token_transfers_with_no_send_account_created";
ALTER TABLE public.send_token_transfers ENABLE TRIGGER "insert_verification_sends";
ALTER TABLE public.send_token_transfers ENABLE TRIGGER "insert_send_streak_verification";
