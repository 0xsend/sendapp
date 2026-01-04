SET client_min_messages TO NOTICE;

BEGIN;
SELECT plan(2);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Switch to service_role for tests
SELECT set_config('role', 'service_role', TRUE);

-- Create test users
SELECT tests.create_supabase_user('ssc_sender');
SELECT tests.create_supabase_user('ssc_redeemer_verified_1');
SELECT tests.create_supabase_user('ssc_redeemer_verified_2');
SELECT tests.create_supabase_user('ssc_redeemer_unverified');

-- Ensure there is exactly one active distribution window for send_scores_current
DELETE FROM distributions
WHERE qualification_start <= (now() AT TIME ZONE 'UTC')
  AND qualification_end >= (now() AT TIME ZONE 'UTC');

-- Create a minimal active distribution and send_slash settings
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
  'active distribution for pgTAP',
  100000,
  1000000,
  1000000,
  1000000,
  (now() AT TIME ZONE 'UTC')::timestamp(3)::timestamptz - interval '1 day',
  (now() AT TIME ZONE 'UTC')::timestamp(3)::timestamptz + interval '1 day',
  100::bigint,
  0::bigint,
  (now() AT TIME ZONE 'UTC')::timestamp(3)::timestamptz + interval '30 days',
  8453,
  '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea
);

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
  1
);

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

-- Create send accounts. address_bytes is generated from address.
-- NOTE: is_verified is populated by a BEFORE INSERT trigger based on profiles.verified_at,
-- so we set it explicitly after insert for deterministic test behavior.
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
VALUES
  (tests.get_supabase_uid('ssc_sender'), '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 8453, '\\x00'),
  (tests.get_supabase_uid('ssc_redeemer_verified_1'), '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 8453, '\\x00'),
  (tests.get_supabase_uid('ssc_redeemer_verified_2'), '0xdddddddddddddddddddddddddddddddddddddddd', 8453, '\\x00'),
  (tests.get_supabase_uid('ssc_redeemer_unverified'), '0xcccccccccccccccccccccccccccccccccccccccc', 8453, '\\x00')
ON CONFLICT DO NOTHING;

UPDATE send_accounts
SET is_verified = TRUE
WHERE address IN (
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'::citext,
  '0xdddddddddddddddddddddddddddddddddddddddd'::citext
);

-- Insert send_check_claimed rows.
-- Only SEND token claims to verified redeemers (and not self) should count toward send_scores_current.
INSERT INTO send_check_claimed(
  chain_id, log_addr, block_time, tx_hash, tx_idx,
  ephemeral_address, sender, token, amount, expires_at, redeemer,
  ig_name, src_name, block_num, log_idx, abi_idx
) VALUES
  -- valid: verified redeemer 1, amount 42
  (8453, '\x01020304', extract(epoch from (now() at time zone 'UTC')),
   '\x' || encode(gen_random_bytes(16),'hex')::text::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea,
   42::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
   'ssc', 'ssc', 5000, 0, 0),

  -- invalid: unverified redeemer, should not count
  (8453, '\x01020304', extract(epoch from (now() at time zone 'UTC')),
   '\x' || encode(gen_random_bytes(16),'hex')::text::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea,
   50::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xcccccccccccccccccccccccccccccccccccccccc',
   'ssc', 'ssc', 5001, 0, 0),

  -- invalid: wrong token, should not count
  (8453, '\x01020304', extract(epoch from (now() at time zone 'UTC')),
   '\x' || encode(gen_random_bytes(16),'hex')::text::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\x833589fcd6edb6e08f4c7c32d4f71b54bda02913'::bytea,
   60::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
   'ssc', 'ssc', 5002, 0, 0),

  -- invalid: self-claim, should not count
  (8453, '\x01020304', extract(epoch from (now() at time zone 'UTC')),
   '\x' || encode(gen_random_bytes(16),'hex')::text::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea,
   70::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   'ssc', 'ssc', 5003, 0, 0),

  -- valid: second claim to same verified redeemer 1, causes per-recipient capping at send_ceiling=100
  (8453, '\x01020304', extract(epoch from (now() at time zone 'UTC')),
   '\x' || encode(gen_random_bytes(16),'hex')::text::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea,
   100::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
   'ssc', 'ssc', 5004, 0, 0),

  -- valid: verified redeemer 2 adds a second unique send
  (8453, '\x01020304', extract(epoch from (now() at time zone 'UTC')),
   '\x' || encode(gen_random_bytes(16),'hex')::text::bytea, 0,
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
   '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea,
   10::numeric, extract(epoch from (now() at time zone 'UTC')) + 1000,
   '\xdddddddddddddddddddddddddddddddddddddddd',
   'ssc', 'ssc', 5005, 0, 0);

-- send_ceiling = ROUND(hodler_min_balance / (minimum_sends * scaling_divisor)) = 100.
-- For verified redeemer 1: amounts 42 + 100 = 142, capped to 100.
-- For verified redeemer 2: amount 10, capped to 10.
-- Total score = 110, unique_sends = 2.
SELECT results_eq($$
  SELECT
    score::text,
    unique_sends::bigint,
    send_ceiling::text
  FROM send_scores_current
  WHERE user_id = tests.get_supabase_uid('ssc_sender')
$$,
$$VALUES (
  110::text,
  2::bigint,
  100::text
)$$,
'send_check_claimed contributes to send_scores_current only for verified redeemers + SEND token, with per-recipient capping');

SELECT ok(
  (SELECT COUNT(*) FROM send_scores_current WHERE user_id = tests.get_supabase_uid('ssc_sender')) = 1,
  'send_scores_current has exactly one row for sender'
);

SELECT finish();
ROLLBACK;

RESET client_min_messages;
