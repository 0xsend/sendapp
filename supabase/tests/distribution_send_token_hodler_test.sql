BEGIN;
SELECT plan(2);

-- Create test user and Send account
CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";
SELECT tests.create_supabase_user('hodler_user');

-- Deterministic test address and token
DO $$
DECLARE
  _uid uuid := tests.get_supabase_uid('hodler_user');
BEGIN
  INSERT INTO public.send_accounts (user_id, address, chain_id, init_code)
  VALUES (
    _uid,
    '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
  );
END$$;

-- Find the active distribution threshold
WITH now_utc AS (
  SELECT CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS now_ts
), active AS (
  SELECT id, hodler_min_balance FROM public.distributions, now_utc n
  WHERE n.now_ts >= qualification_start AND n.now_ts < qualification_end
  ORDER BY qualification_start DESC LIMIT 1
)
SELECT ok((SELECT count(*) FROM active) = 1, 'Active distribution exists');

-- Insert a SEND token transfer (deposit) into the account with v = threshold + 1
WITH now_utc AS (
  SELECT CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS now_ts
), active AS (
  SELECT id, hodler_min_balance FROM public.distributions, now_utc n
  WHERE n.now_ts >= qualification_start AND n.now_ts < qualification_end
  ORDER BY qualification_start DESC LIMIT 1
), sa AS (
  SELECT user_id, address, chain_id, decode(replace(address::text,'0x',''),'hex') AS addr_bytea
  FROM public.send_accounts WHERE address = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
)
INSERT INTO public.send_token_transfers (
  chain_id, log_addr, block_time, tx_hash, f, t, v, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx
) SELECT
  sa.chain_id,
  decode('f39Fd6e51aad88F6F4ce6aB8827279cffFb92266','hex'),
  EXTRACT(EPOCH FROM (SELECT now_ts FROM now_utc))::numeric,
  '\\x01'::bytea,
  decode('1234567890ABCDEF1234567890ABCDEF12345678','hex'),  -- external sender
  sa.addr_bytea,
  (SELECT hodler_min_balance + 1 FROM active),
  'test_ig', 'test_src', 1, 0, 0, 0
FROM sa;

-- Expect token_balances row updated with SEND token and positive balance
SELECT ok(
  EXISTS (
    SELECT 1 FROM public.token_balances tb
    JOIN public.send_accounts sa ON sa.user_id = tb.user_id
    WHERE sa.address = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
      AND tb.token IS NOT NULL
      AND tb.balance > 0
  ),
  'token_balances updated on send_token_transfers deposit'
);

-- Expect a distribution_verifications row for send_token_hodler at active distribution
WITH now_utc AS (
  SELECT CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS now_ts
), active AS (
  SELECT id, hodler_min_balance FROM public.distributions, now_utc n
  WHERE n.now_ts >= qualification_start AND n.now_ts < qualification_end
  ORDER BY qualification_start DESC LIMIT 1
), u AS (
  SELECT user_id FROM public.send_accounts WHERE address = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
)
SELECT ok(
  EXISTS (
    SELECT 1
    FROM public.distribution_verifications dv, active a, u
    WHERE dv.distribution_id = a.id
      AND dv.user_id = u.user_id
      AND dv.type = 'send_token_hodler'
      AND dv.weight > a.hodler_min_balance
  ),
  'distribution_verifications inserted/updated for send_token_hodler'
);

SELECT finish();
ROLLBACK;
