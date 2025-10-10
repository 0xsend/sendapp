BEGIN;
SELECT plan(4);
CREATE EXTENSION "basejump-supabase_test_helpers";

-- Use service_role for setup
SELECT set_config('role', 'service_role', TRUE);

-- Create participants
SELECT tests.create_supabase_user('alice');
SELECT tests.create_supabase_user('bob');

-- Send account created logs (enable joins in views)
INSERT INTO send_account_created(
  chain_id, log_addr, block_time, user_op_hash, tx_hash,
  account, ig_name, src_name, block_num, tx_idx, log_idx
) VALUES
(
  8453,
  '\\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  EXTRACT(EPOCH FROM (now() AT TIME ZONE 'UTC' - interval '2 days')),
  '\\x01', '\\x01',
  '\\xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  'send_account_created','send_account_created',
  1,0,0
),
(
  8453,
  '\\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  EXTRACT(EPOCH FROM (now() AT TIME ZONE 'UTC' - interval '2 days')),
  '\\x02', '\\x02',
  '\\xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  'send_account_created','send_account_created',
  2,0,0
);

-- Send accounts (one per user)
INSERT INTO send_accounts(user_id, address, chain_id, init_code) VALUES
(tests.get_supabase_uid('alice'), '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 8453, '\\x00'),
(tests.get_supabase_uid('bob'),   '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 8453, '\\x00');

-- Create an active distribution (now within window)
DELETE FROM distributions
WHERE qualification_start <= (now() AT TIME ZONE 'UTC')
  AND qualification_end   >= (now() AT TIME ZONE 'UTC');

INSERT INTO distributions(
  number, tranche_id, name, description, amount,
  hodler_pool_bips, bonus_pool_bips, fixed_pool_bips,
  qualification_start, qualification_end,
  hodler_min_balance, earn_min_balance,
  claim_end, chain_id, token_addr
) VALUES (
  1000, 1000, 'Test Active Dist', 'For live shares test',
  1000000, 1000000, 0, 0,
  (now() AT TIME ZONE 'UTC') - interval '1 hour',
  (now() AT TIME ZONE 'UTC') + interval '23 hours',
  1000, 0,
  (now() AT TIME ZONE 'UTC') + interval '30 days',
  8453,
  '\\xEAB49138BA2EA6DD776220FE26B7B8E446638956'
);

-- Configure send_slash for the active distribution (min_sends=10, divisor=1)
INSERT INTO send_slash(distribution_id, distribution_number, minimum_sends, scaling_divisor)
SELECT id, number, 10, 1 FROM distributions WHERE number = 1000;

-- Ensure DVV exists for send_token_hodler (FK for DV)
INSERT INTO distribution_verification_values(
  type, fixed_value, bips_value, distribution_id,
  multiplier_min, multiplier_max, multiplier_step
) SELECT 'send_token_hodler', 0, 0, id, 0, 0, 0
  FROM distributions WHERE number = 1000;

-- Minimal transfer to produce a send_score
-- alice -> bob within window; v = 50; token_addr matches distribution
INSERT INTO send_token_transfers(
  f, t, v, block_time, chain_id, tx_hash,
  ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, log_addr
) VALUES (
  '\\xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  '\\xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
  50::bigint,
  EXTRACT(EPOCH FROM (now() AT TIME ZONE 'UTC' - interval '30 minutes')),
  8453,
  '\\x010203',
  'send_token_transfers', 'send_token_transfers',
  10,0,0,0,
  (SELECT token_addr FROM distributions WHERE number = 1000)
);

-- Upsert hodler verification with a balance >= hodler_min_balance (e.g., 2000)
INSERT INTO distribution_verifications(distribution_id, user_id, type, weight, metadata)
SELECT id, tests.get_supabase_uid('alice'), 'send_token_hodler', 2000, NULL
FROM distributions WHERE number = 1000;

-- 1) Function returns a row for alice
SELECT ok(
  EXISTS (
    SELECT 1
    FROM compute_active_distribution_shares('ease_in_out') s
    WHERE s.user_id = tests.get_supabase_uid('alice')
      AND s.amount > 0
  ),
  'compute_active_distribution_shares should return a positive amount for alice'
);

-- 2) View active_distribution_shares is readable and includes alice
SELECT ok(
  EXISTS (
    SELECT 1 FROM active_distribution_shares ads
    WHERE ads.user_id = tests.get_supabase_uid('alice')
  ),
  'active_distribution_shares should include alice'
);

-- 3) user_active_distribution_share filters by auth.uid()
SELECT tests.authenticate_as('alice');
SELECT ok(
  EXISTS (
    SELECT 1 FROM user_active_distribution_share uas
  ),
  'user_active_distribution_share should return a row for the authed user'
);
SELECT tests.clear_authentication();

-- 4) No row for a user without hodler DV
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM compute_active_distribution_shares('ease_in_out') s
    WHERE s.user_id = tests.get_supabase_uid('bob')
  ),
  'bob should not appear without send_token_hodler DV'
);

SELECT finish();
ROLLBACK;
