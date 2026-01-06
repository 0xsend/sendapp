SET client_min_messages TO NOTICE;

BEGIN;

SELECT plan(1);

CREATE EXTENSION IF NOT EXISTS pgtap;
CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Use service_role for test setup and for querying the score views.
SELECT set_config('role', 'service_role', TRUE);

-- Create test users
SELECT tests.create_supabase_user('ssc_sender');
SELECT tests.create_supabase_user('ssc_redeemer_1');
SELECT tests.create_supabase_user('ssc_redeemer_2');
SELECT tests.create_supabase_user('ssc_redeemer_3');

-- Ensure there is exactly one active distribution for send_scores_current to select.
DELETE FROM distributions
WHERE qualification_start <= (now() AT TIME ZONE 'UTC')
  AND qualification_end >= (now() AT TIME ZONE 'UTC');

-- Create an active distribution with a deterministic send_ceiling:
-- hodler_min_balance=1000, minimum_sends=1, scaling_divisor=10 => send_ceiling=100
INSERT INTO distributions(
  number,
  tranche_id,
  name,
  description,
  amount,
  hodler_pool_bips,
  bonus_pool_bips,
  fixed_pool_bips,
  qualification_start,
  qualification_end,
  hodler_min_balance,
  earn_min_balance,
  claim_end,
  chain_id,
  token_addr
)
VALUES (
  424242,
  424242,
  'send_scores checks claimed test',
  'active distribution for send_scores_current check-claim tests',
  100000,
  1000000,
  1000000,
  1000000,
  (now() AT TIME ZONE 'UTC')::timestamp(3)::timestamptz - interval '1 day',
  (now() AT TIME ZONE 'UTC')::timestamp(3)::timestamptz + interval '1 day',
  1000::bigint,
  0::bigint,
  (now() AT TIME ZONE 'UTC')::timestamp(3)::timestamptz + interval '2 days',
  8453,
  '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea
)
ON CONFLICT DO NOTHING;

INSERT INTO send_slash(
  distribution_id,
  distribution_number,
  minimum_sends,
  scaling_divisor
)
VALUES (
  (SELECT id FROM distributions WHERE number = 424242),
  424242,
  1,
  10
)
ON CONFLICT DO NOTHING;

-- Satisfy FK required by insert_verification_create_passkey() trigger on send_accounts
INSERT INTO public.distribution_verification_values(
  type,
  fixed_value,
  bips_value,
  distribution_id
)
VALUES (
  'create_passkey'::public.verification_type,
  0,
  0,
  (SELECT id FROM distributions WHERE number = 424242)
)
ON CONFLICT DO NOTHING;

-- Create send_accounts. address_bytes is generated from address.
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
VALUES
  (tests.get_supabase_uid('ssc_sender'), '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 8453, '\\x00'),
  (tests.get_supabase_uid('ssc_redeemer_1'), '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 8453, '\\x00'),
  (tests.get_supabase_uid('ssc_redeemer_2'), '0xdddddddddddddddddddddddddddddddddddddddd', 8453, '\\x00'),
  (tests.get_supabase_uid('ssc_redeemer_3'), '0xcccccccccccccccccccccccccccccccccccccccc', 8453, '\\x00')
ON CONFLICT DO NOTHING;

-- Insert send_check_claimed rows.
-- All SEND token claims (not self) should count toward send_scores_current.
-- This matches 1-1 with send_token_transfers pattern (f->sender, t->redeemer, v->amount).
INSERT INTO send_check_claimed(
  chain_id, log_addr, block_time, tx_hash, tx_idx,
  ephemeral_address, sender, token, amount, expires_at, redeemer,
  ig_name, src_name, block_num, log_idx, abi_idx
)
VALUES
  -- valid: redeemer 1, amount 42
  (8453, '\x01020304'::bytea, extract(epoch from (now() at time zone 'UTC')),
   '\x00000000000000000000000000000001'::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea,
   42::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'::bytea,
   'ssc', 'ssc', 5000, 0, 0),

  -- valid: redeemer 3, amount 50
  (8453, '\x01020304'::bytea, extract(epoch from (now() at time zone 'UTC')),
   '\x00000000000000000000000000000002'::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea,
   50::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xcccccccccccccccccccccccccccccccccccccccc'::bytea,
   'ssc', 'ssc', 5001, 0, 0),

  -- invalid: wrong token, should not count
  (8453, '\x01020304'::bytea, extract(epoch from (now() at time zone 'UTC')),
   '\x00000000000000000000000000000003'::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\x833589fcd6edb6e08f4c7c32d4f71b54bda02913'::bytea,
   60::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'::bytea,
   'ssc', 'ssc', 5002, 0, 0),

  -- invalid: self-claim, should not count
  (8453, '\x01020304'::bytea, extract(epoch from (now() at time zone 'UTC')),
   '\x00000000000000000000000000000004'::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea,
   70::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   'ssc', 'ssc', 5003, 0, 0),

  -- valid: second claim to redeemer 1, causes per-recipient capping at send_ceiling=100
  (8453, '\x01020304'::bytea, extract(epoch from (now() at time zone 'UTC')),
   '\x00000000000000000000000000000005'::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea,
   100::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'::bytea,
   'ssc', 'ssc', 5004, 0, 0),

  -- valid: redeemer 2 adds a third unique send
  (8453, '\x01020304'::bytea, extract(epoch from (now() at time zone 'UTC')),
   '\x00000000000000000000000000000006'::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::bytea,
   '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea,
   10::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xdddddddddddddddddddddddddddddddddddddddd'::bytea,
   'ssc', 'ssc', 5005, 0, 0);

-- send_ceiling = ROUND(hodler_min_balance / (minimum_sends * scaling_divisor)) = 100.
-- For redeemer 1: amounts 42 + 100 = 142, capped to 100.
-- For redeemer 2: amount 10.
-- For redeemer 3: amount 50.
-- Total score = 100 + 10 + 50 = 160, unique_sends = 3.
SELECT results_eq(
  $$
    SELECT
      score::text,
      unique_sends::bigint,
      send_ceiling::text
    FROM send_scores_current
    WHERE user_id = tests.get_supabase_uid('ssc_sender')
  $$,
  $$VALUES (
    160::text,
    3::bigint,
    100::text
  )$$,
  'send_check_claimed contributes to send_scores_current for all SEND token claims (not self), with per-recipient capping'
);

SELECT * FROM finish();

ROLLBACK;

RESET client_min_messages;
