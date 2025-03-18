BEGIN;
SELECT plan(19);

-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers";

-- Create test users
SELECT tests.create_supabase_user('earn_user1');
SELECT tests.create_supabase_user('earn_user2');
SELECT tests.create_supabase_user('earn_affiliate');

-- Create send accounts for the test users
INSERT INTO send_account_created (
    chain_id,
    log_addr,
    block_time,
    user_op_hash,
    tx_hash,
    account,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx
) VALUES
(8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')),
 '\x1234', '\x1234', '\xEA5E000000000000000000000000000000000001',
 'send_account_created', 'send_account_created', 1, 0, 0),
(8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')),
 '\x1234', '\x1234', '\xEA5E000000000000000000000000000000000002',
 'send_account_created', 'send_account_created', 2, 0, 0),
(8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')),
 '\x1234', '\x1234', '\xAFF1000000000000000000000000000000000001',
 'send_account_created', 'send_account_created', 3, 0, 0);

INSERT INTO send_accounts (
    user_id,
    address,
    chain_id,
    init_code
) VALUES
(tests.get_supabase_uid('earn_user1'),
 '0xEA5E000000000000000000000000000000000001',
 8453,
 '\x00112233445566778899AABBCCDDEEFF'),
(tests.get_supabase_uid('earn_user2'),
 '0xEA5E000000000000000000000000000000000002',
 8453,
 '\x00112233445566778899AABBCCDDEEFF'),
(tests.get_supabase_uid('earn_affiliate'),
 '0xAFF1000000000000000000000000000000000001',
 8453,
 '\x00112233445566778899AABBCCDDEEFF');

-- Set up test data
-- 1. Create a send_earn contract
INSERT INTO send_earn_create (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    send_earn,
    caller,
    initial_owner,
    vault,
    fee_recipient,
    collections,
    fee,
    salt,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')),
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    '\xEA5E000000000000000000000000000000000099',
    '\x0000000000000000000000000000000000000000',
    '\x0000000000000000000000000000000000000000',
    '\xEA5E000000000000000000000000000000000088',
    '\xAFF1000000000000000000000000000000000099',
    '\x0000000000000000000000000000000000000000',
    1000,
    '\x0000000000000000000000000000000000000000',
    'send_earn_create',
    'send_earn_create',
    1,
    0,
    0,
    0
);

-- 2. Create a send_earn_new_affiliate
INSERT INTO send_earn_new_affiliate (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    affiliate,
    send_earn_affiliate,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')),
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    '\xAFF1000000000000000000000000000000000001',
    '\xAFF1000000000000000000000000000000000099',
    'send_earn_new_affiliate',
    'send_earn_new_affiliate',
    1,
    0,
    0,
    0
);

-- Test 1: Verify RLS policies for send_earn_create
SELECT tests.clear_authentication();
SELECT is_empty(
    $$SELECT * FROM send_earn_create$$,
    'Unauthenticated users should not see send_earn_create records'
);

SELECT tests.authenticate_as('earn_user1');
SELECT isnt_empty(
    $$SELECT * FROM send_earn_create$$,
    'Authenticated users should see send_earn_create records'
);

-- Test 2: Verify RLS policies for send_earn_new_affiliate
SELECT tests.clear_authentication();
SELECT is_empty(
    $$SELECT * FROM send_earn_new_affiliate$$,
    'Unauthenticated users should not see send_earn_new_affiliate records'
);

SELECT tests.authenticate_as('earn_user1');
SELECT isnt_empty(
    $$SELECT * FROM send_earn_new_affiliate$$,
    'Authenticated users should see send_earn_new_affiliate records'
);

-- Test 3: Test the send_earn_affiliate_vault function
SELECT tests.authenticate_as('earn_affiliate');
SELECT results_eq(
    $$SELECT affiliate, send_earn_affiliate, send_earn_create.send_earn
      FROM send_earn_new_affiliate
      CROSS JOIN send_earn_affiliate_vault(send_earn_new_affiliate.*) as send_earn_create
      LIMIT 1$$,
    $$SELECT
        '\xAFF1000000000000000000000000000000000001'::bytea as affiliate,
        '\xAFF1000000000000000000000000000000000099'::bytea as send_earn_affiliate,
        '\xEA5E000000000000000000000000000000000099'::bytea as send_earn$$,
    'send_earn_affiliate_vault should return the correct send_earn record'
);

-- Test 4: Test deposits and withdrawals
-- First, add a deposit for earn_user1
SELECT tests.authenticate_as_service_role();
INSERT INTO send_earn_deposits (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    sender,
    owner,
    assets,
    shares,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453,
    '\xEA5E000000000000000000000000000000000099',
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')),
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    '\x0000000000000000000000000000000000000000',
    '\xEA5E000000000000000000000000000000000001',
    1000000,
    1000000,
    'send_earn_deposits',
    'send_earn_deposits',
    1,
    0,
    0,
    0
);

-- Test 5: Verify RLS policies for send_earn_deposits
SELECT tests.clear_authentication();
SELECT is_empty(
    $$SELECT * FROM send_earn_deposits$$,
    'Unauthenticated users should not see send_earn_deposits records'
);

SELECT tests.authenticate_as('earn_user1');
SELECT isnt_empty(
    $$SELECT * FROM send_earn_deposits$$,
    'Authenticated users should see their own send_earn_deposits records'
);

SELECT tests.authenticate_as('earn_user2');
SELECT is_empty(
    $$SELECT * FROM send_earn_deposits$$,
    'Authenticated users should not see other users send_earn_deposits records'
);

-- Test 6: Add a withdrawal for earn_user1
SELECT tests.authenticate_as_service_role();
INSERT INTO send_earn_withdraws (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    sender,
    receiver,
    owner,
    assets,
    shares,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453,
    '\xEA5E000000000000000000000000000000000099',
    floor(extract(EPOCH FROM timestamptz '2024-01-01 13:00:00')),
    '\x1234567890123456789012345678901234567890123456789012345678901235',
    '\x0000000000000000000000000000000000000000',
    '\x0000000000000000000000000000000000000000',
    '\xEA5E000000000000000000000000000000000001',
    500000,
    500000,
    'send_earn_withdraws',
    'send_earn_withdraws',
    2,
    0,
    0,
    0
);

-- Test 7: Verify RLS policies for send_earn_withdraws
SELECT tests.clear_authentication();
SELECT is_empty(
    $$SELECT * FROM send_earn_withdraws$$,
    'Unauthenticated users should not see send_earn_withdraws records'
);

SELECT tests.authenticate_as('earn_user1');
SELECT isnt_empty(
    $$SELECT * FROM send_earn_withdraws$$,
    'Authenticated users should see their own send_earn_withdraws records'
);

SELECT tests.authenticate_as('earn_user2');
SELECT is_empty(
    $$SELECT * FROM send_earn_withdraws$$,
    'Authenticated users should not see other users send_earn_withdraws records'
);

-- Test 8: Test the send_earn_balances view
SELECT tests.authenticate_as('earn_user1');
SELECT results_eq(
    $$SELECT assets, shares FROM send_earn_balances$$,
    $$VALUES (500000::numeric, 500000::numeric)$$,
    'send_earn_balances should show the correct balance after deposit and withdrawal'
);

-- Test 9: Test the send_earn_activity view
SELECT tests.authenticate_as('earn_user1');
SELECT results_eq(
    $$SELECT COUNT(*)::integer FROM send_earn_activity$$,
    $$VALUES (2)$$,
    'send_earn_activity should show both deposit and withdrawal'
);

SELECT results_eq(
    $$SELECT type, assets, shares FROM send_earn_activity ORDER BY block_time ASC$$,
    $$VALUES
      ('deposit', 1000000::numeric, 1000000::numeric),
      ('withdraw', 500000::numeric, 500000::numeric)
    $$,
    'send_earn_activity should show correct transaction details'
);

-- Test 10: Test the filter trigger for deposits
-- Try to insert a deposit for an account that doesn't exist in send_account_created
SELECT tests.authenticate_as_service_role();
INSERT INTO send_earn_deposits (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    sender,
    owner,
    assets,
    shares,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453,
    '\xEA5E000000000000000000000000000000000099',
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')),
    '\x1234567890123456789012345678901234567890123456789012345678901236',
    '\x0000000000000000000000000000000000000000',
    '\xEA5E000000000000000000000000000000000099', -- This account doesn't exist
    1000000,
    1000000,
    'send_earn_deposits',
    'send_earn_deposits',
    3,
    0,
    0,
    0
);

SELECT is_empty(
    $$SELECT * FROM send_earn_deposits WHERE owner = '\xEA5E000000000000000000000000000000000099'$$,
    'Deposits for non-existent accounts should be filtered out'
);

-- Test 11: Test the filter trigger for withdrawals
-- Try to insert a withdrawal for an account that doesn't exist in send_account_created
SELECT tests.authenticate_as_service_role();
INSERT INTO send_earn_withdraws (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    sender,
    receiver,
    owner,
    assets,
    shares,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453,
    '\xEA5E000000000000000000000000000000000099',
    floor(extract(EPOCH FROM timestamptz '2024-01-01 13:00:00')),
    '\x1234567890123456789012345678901234567890123456789012345678901237',
    '\x0000000000000000000000000000000000000000',
    '\x0000000000000000000000000000000000000000',
    '\xEA5E000000000000000000000000000000000099', -- This account doesn't exist
    500000,
    500000,
    'send_earn_withdraws',
    'send_earn_withdraws',
    4,
    0,
    0,
    0
);

SELECT is_empty(
    $$SELECT * FROM send_earn_withdraws WHERE owner = '\xEA5E000000000000000000000000000000000099'$$,
    'Withdrawals for non-existent accounts should be filtered out'
);

-- Test 12: Test the referral relationship trigger
-- First, delete any existing referrals and related activity for the test users
DELETE FROM activity
WHERE event_name = 'referrals'
AND from_user_id = tests.get_supabase_uid('earn_affiliate');

DELETE FROM referrals
WHERE referrer_id = tests.get_supabase_uid('earn_affiliate')
OR referred_id = tests.get_supabase_uid('earn_user2');

-- Verify no referral exists
SELECT is_empty(
    $$SELECT * FROM referrals WHERE referrer_id = tests.get_supabase_uid('earn_affiliate')$$,
    'No referral should exist initially'
);

-- The insert_referral_on_deposit trigger is already created in the migrations

-- Now add a deposit that should trigger a referral
INSERT INTO send_earn_deposits (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    sender,
    owner,
    assets,
    shares,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453,
    '\xEA5E000000000000000000000000000000000099',
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')),
    '\x1234567890123456789012345678901234567890123456789012345678901238',
    '\x0000000000000000000000000000000000000000',
    '\xEA5E000000000000000000000000000000000002', -- earn_user2
    1000000,
    1000000,
    'send_earn_deposits',
    'send_earn_deposits',
    5,
    0,
    0,
    0
);

-- Verify the referral was created
SELECT isnt_empty(
    $$SELECT * FROM referrals
      WHERE referrer_id = tests.get_supabase_uid('earn_affiliate')
      AND referred_id = tests.get_supabase_uid('earn_user2')$$,
    'A referral should be created when a user deposits to an affiliate vault'
);

-- Test 13: Verify that a second deposit doesn't create another referral
INSERT INTO send_earn_deposits (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    sender,
    owner,
    assets,
    shares,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453,
    '\xEA5E000000000000000000000000000000000099',
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')),
    '\x1234567890123456789012345678901234567890123456789012345678901239',
    '\x0000000000000000000000000000000000000000',
    '\xEA5E000000000000000000000000000000000002', -- earn_user2
    2000000,
    2000000,
    'send_earn_deposits',
    'send_earn_deposits',
    6,
    0,
    0,
    0
);

SELECT results_eq(
    $$SELECT COUNT(*)::integer FROM referrals
      WHERE referrer_id = tests.get_supabase_uid('earn_affiliate')
      AND referred_id = tests.get_supabase_uid('earn_user2')$$,
    $$VALUES (1)$$,
    'Only one referral should exist even after multiple deposits'
);

SELECT * FROM finish();
ROLLBACK;
