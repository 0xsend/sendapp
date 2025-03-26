/*
 * Send Earn Referral Tests
 *
 * This file implements comprehensive tests for the Send Earn referral system,
 * particularly focusing on:
 * 1. The complete referral flow during a Send Earn deposit
 * 2. Validating that duplicate referrals aren't created
 * 3. Testing referral creation when send_earn_create is indexed after deposit and affiliate
 */
BEGIN;
SELECT plan(17);

-- Create the necessary extensions
CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- ============================================================================
-- Create test users and necessary database records
-- ============================================================================

-- Create test users with clear naming to indicate their roles
SELECT tests.create_supabase_user('referrer_affiliate');
SELECT tests.create_supabase_user('referred_user1');

-- Clear any existing test data for a clean state
DELETE FROM activity
WHERE event_name = 'referrals'
AND (
  from_user_id = tests.get_supabase_uid('referrer_affiliate')
  OR to_user_id = tests.get_supabase_uid('referred_user1')
);

DELETE FROM referrals
WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate')
OR referred_id = tests.get_supabase_uid('referred_user1');

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
-- Referrer/Affiliate account
(8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')),
 '\x1111', '\x1111', '\xaff1111111111111111111111111111111111111',
 'send_account_created', 'send_account_created', 1, 0, 0),
-- Referred user account
(8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')),
 '\x2222', '\x2222', '\xaab1222222222222222222222222222222222222',
 'send_account_created', 'send_account_created', 2, 0, 0);

INSERT INTO send_accounts (
    user_id,
    address,
    chain_id,
    init_code
) VALUES
(tests.get_supabase_uid('referrer_affiliate'),
 '0xaff1111111111111111111111111111111111111',
 8453,
 '\x00112233445566778899aabbccddeeff'),
(tests.get_supabase_uid('referred_user1'),
 '0xaab1222222222222222222222222222222222222',
 8453,
 '\x00112233445566778899aabbccddeeff');

-- Set up Send Earn contracts with proper linkage - Matching the pattern in send_earn_test.sql
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
    '\xeaea111111111111111111111111111111111111111111111111111111111111',
    '\xea5e000000000000000000000000000000000099', -- Send Earn contract address
    '\x0000000000000000000000000000000000000000',
    '\x0000000000000000000000000000000000000000',
    '\xea5e000000000000000000000000000000000088', -- Vault address
    '\xaff1000000000000000000000000000000000099', -- Fee recipient (must match send_earn_affiliate below)
    '\x0000000000000000000000000000000000000000',
    1000, -- Fee basis points (10%)
    '\x0000000000000000000000000000000000000000',
    'send_earn_create',
    'send_earn_create',
    1000,
    0,
    0,
    0
);

-- Create affiliate with explicit relationship to vault - Make sure identically to original test
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
    '\xeaea111111111111111111111111111111111111111111111111111111111111',
    '\xaff1111111111111111111111111111111111111', -- Affiliate address (referrer)
    '\xaff1000000000000000000000000000000000099', -- Send Earn affiliate address
    'send_earn_new_affiliate',
    'send_earn_new_affiliate',
    1000,
    1,
    0,
    0
);

-- Verify affiliate relationship with send_earn_affiliate_vault function
SELECT tests.authenticate_as_service_role();
SELECT results_eq(
    $$SELECT affiliate, send_earn_affiliate, send_earn_create.send_earn
      FROM send_earn_new_affiliate
      CROSS JOIN send_earn_affiliate_vault(send_earn_new_affiliate.*) as send_earn_create
      LIMIT 1$$,
    $$SELECT
        '\xaff1111111111111111111111111111111111111'::bytea as affiliate,
        '\xaff1000000000000000000000000000000000099'::bytea as send_earn_affiliate,
        '\xea5e000000000000000000000000000000000099'::bytea as send_earn$$,
    'send_earn_affiliate_vault should return the correct send_earn record'
);

-- ============================================================================
-- Comprehensive Send Earn Deposit Referral Flow Test
-- ============================================================================

-- Verify no referral exists initially
SELECT is_empty(
    $$SELECT * FROM referrals
      WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate')
      AND referred_id = tests.get_supabase_uid('referred_user1')$$,
    'No referral should exist before deposit'
);

-- Insert a Send Earn deposit that should create a referral
INSERT INTO send_earn_deposit (
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
    '\xea5e000000000000000000000000000000000099', -- Send Earn contract address (must match send_earn in send_earn_create)
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:05:00')),
    '\xaaaa111111111111111111111111111111111111111111111111111111111111',
    '\x0000000000000000000000000000000000000000',
    '\xaab1222222222222222222222222222222222222', -- First referred user
    1000000, -- Assets amount
    1000000, -- Shares amount
    'send_earn_deposit',
    'send_earn_deposit',
    1100,
    0,
    0,
    0
);

-- Verify the referral record exists with correct IDs
SELECT isnt_empty(
    $$SELECT * FROM referrals
      WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate')
      AND referred_id = tests.get_supabase_uid('referred_user1')$$,
    'Referral relationship should be created with correct IDs'
);

-- Verify referral timestamps are set correctly
SELECT ok(
    (SELECT created_at IS NOT NULL
     FROM referrals
     WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate')
     AND referred_id = tests.get_supabase_uid('referred_user1')),
    'Referral timestamp should be set'
);

-- Check activity entry creation
SELECT isnt_empty(
    $$SELECT * FROM activity
      WHERE event_name = 'referrals'
      AND from_user_id = tests.get_supabase_uid('referrer_affiliate')
      AND to_user_id = tests.get_supabase_uid('referred_user1')$$,
    'Activity entry should be created for the referral'
);

-- Validate activity data format (has tags field)
SELECT ok(
    (SELECT data ? 'tags'
     FROM activity
     WHERE event_name = 'referrals'
     AND from_user_id = tests.get_supabase_uid('referrer_affiliate')
     AND to_user_id = tests.get_supabase_uid('referred_user1')),
    'Activity data should include tags field'
);

-- Add another deposit from same user to test duplicate prevention
INSERT INTO send_earn_deposit (
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
    '\xea5e000000000000000000000000000000000099',
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:10:00')),
    '\xbbbb222222222222222222222222222222222222222222222222222222222222',
    '\x0000000000000000000000000000000000000000',
    '\xaab1222222222222222222222222222222222222', -- Same referred user
    2000000, -- Different amount
    2000000,
    'send_earn_deposit',
    'send_earn_deposit',
    1200,
    0,
    0,
    0
);

-- Verify no duplicate referrals
SELECT results_eq(
    $$SELECT COUNT(*)::integer
      FROM referrals
      WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate')
      AND referred_id = tests.get_supabase_uid('referred_user1')$$,
    $$VALUES (1)$$,
    'Only one referral should exist even after multiple deposits'
);

DELETE FROM send_earn_deposit
WHERE owner = '\xaab1222222222222222222222222222222222222'
AND log_addr = '\xea5e000000000000000000000000000000000099';

-- Setup for case when the deposit is indexed before the affiliate
DELETE FROM send_earn_new_affiliate
WHERE affiliate = '\xaff1111111111111111111111111111111111111'
AND send_earn_affiliate = '\xaff1000000000000000000000000000000000099';

-- delete existing referrals
DELETE FROM referrals
WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate')
OR referred_id = tests.get_supabase_uid('referred_user1');

-- Verify no deposit exists
SELECT is_empty(
    $$SELECT * FROM send_earn_deposit
      WHERE log_addr = '\xea5e000000000000000000000000000000000099'$$,
    'No referral should exist before deposit'
);

-- Verify no affiliate exists
SELECT is_empty(
    $$SELECT * FROM send_earn_new_affiliate
      WHERE affiliate = '\xaff1111111111111111111111111111111111111'
      AND send_earn_affiliate = '\xaff1000000000000000000000000000000000099'$$,
    'No affiliate should exist before deposit'
);

-- Verify no referral exists
SELECT is_empty(
    $$SELECT * FROM referrals
      WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate')
      AND referred_id = tests.get_supabase_uid('referred_user1')$$,
    'No referral should exist before deposit'
);

-- Insert a Send Earn deposit for referred_user2, this should not create a referral
insert into send_earn_deposit (
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
    '\xea5e000000000000000000000000000000000099',
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:10:00')),
    '\xcccc333333333333333333333333333333333333333333333333333333333333',
    '\x0000000000000000000000000000000000000000',
    '\xaab1222222222222222222222222222222222222', -- Same referred user
    1000000,
    1000000,
    'send_earn_deposit',
    'send_earn_deposit',
    1300,
    0,
    0,
    0
);

-- Verify no referral exists yet (since affiliate hasn't been indexed)
SELECT is_empty(
    $$SELECT * FROM referrals
      WHERE referred_id = tests.get_supabase_uid('referred_user2')$$,
    'No referral should exist before affiliate is indexed'
);

-- Insert the Send Earn affiliate record with the same transaction hash
-- This should trigger the insert_referral_on_new_affiliate function
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
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:15:00')),
    '\xcccc333333333333333333333333333333333333333333333333333333333333', -- Same TX hash as deposit
    '\xaff1111111111111111111111111111111111111', -- Affiliate address (referrer)
    '\xaff1000000000000000000000000000000000099',
    'send_earn_new_affiliate',
    'send_earn_new_affiliate',
    1300,
    1,
    0,
    0
);

-- Verify the referral is created retroactively
SELECT isnt_empty(
    $$SELECT * FROM referrals
      WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate')
      AND referred_id = tests.get_supabase_uid('referred_user1')$$,
    'Referral should be created retroactively when affiliate is indexed'
);

-- ============================================================================
-- Test for send_earn_create trigger - Third case where send_earn_create is indexed last
-- ============================================================================

-- Clear existing test data
DELETE FROM send_earn_create
WHERE send_earn = '\xea5e000000000000000000000000000000000099';

DELETE FROM send_earn_new_affiliate
WHERE send_earn_affiliate = '\xaff1000000000000000000000000000000000099';

DELETE FROM send_earn_deposit
WHERE log_addr = '\xea5e000000000000000000000000000000000099';

DELETE FROM referrals
WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate')
OR referred_id = tests.get_supabase_uid('referred_user1');

-- Create test users for the third scenario
SELECT tests.create_supabase_user('referrer_affiliate2');
SELECT tests.create_supabase_user('referred_user2');

-- Create send accounts for these users
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
-- Referrer/Affiliate account
(8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 floor(extract(EPOCH FROM timestamptz '2024-01-01 14:00:00')),
 '\x3333', '\x3333', '\xaff2222222222222222222222222222222222222',
 'send_account_created', 'send_account_created', 2000, 0, 0),
-- Referred user account
(8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
 floor(extract(EPOCH FROM timestamptz '2024-01-01 14:00:00')),
 '\x4444', '\x4444', '\xaab2222222222222222222222222222222222222',
 'send_account_created', 'send_account_created', 2001, 0, 0);

INSERT INTO send_accounts (
    user_id,
    address,
    chain_id,
    init_code
) VALUES
(tests.get_supabase_uid('referrer_affiliate2'),
 '0xaff2222222222222222222222222222222222222',
 8453,
 '\x00112233445566778899aabbccddeeff'),
(tests.get_supabase_uid('referred_user2'),
 '0xaab2222222222222222222222222222222222222',
 8453,
 '\x00112233445566778899aabbccddeeff');

-- Verify no referral exists initially
SELECT is_empty(
    $$SELECT * FROM referrals
      WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate2')
      AND referred_id = tests.get_supabase_uid('referred_user2')$$,
    'No referral should exist before deposit (scenario 3)'
);

-- First, insert a deposit to a contract that doesn't exist yet
INSERT INTO send_earn_deposit (
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
    '\xea5e000000000000000000000000000000000088', -- Different Send Earn contract address
    floor(extract(EPOCH FROM timestamptz '2024-01-01 14:05:00')),
    '\xdddd444444444444444444444444444444444444444444444444444444444444',
    '\x0000000000000000000000000000000000000000',
    '\xaab2222222222222222222222222222222222222', -- Referred user for this scenario
    1000000,
    1000000,
    'send_earn_deposit',
    'send_earn_deposit',
    2100,
    0,
    0,
    0
);

-- Verify no referral exists after deposit (since no contract or affiliate exists yet)
SELECT is_empty(
    $$SELECT * FROM referrals
      WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate2')
      AND referred_id = tests.get_supabase_uid('referred_user2')$$,
    'No referral should exist after deposit with no contract (scenario 3)'
);

-- Second, create the affiliate relationship
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
    floor(extract(EPOCH FROM timestamptz '2024-01-01 14:15:00')),
    '\xdddd444444444444444444444444444444444444444444444444444444444444', -- Same TX hash as deposit
    '\xaff2222222222222222222222222222222222222', -- Affiliate address (referrer)
    '\xaff2000000000000000000000000000000000088', -- Different Send Earn affiliate address
    'send_earn_new_affiliate',
    'send_earn_new_affiliate',
    2200,
    1,
    0,
    0
);

-- Verify no referral exists after affiliate (since no contract exists yet)
SELECT is_empty(
    $$SELECT * FROM referrals
      WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate2')
      AND referred_id = tests.get_supabase_uid('referred_user2')$$,
    'No referral should exist after affiliate with no contract (scenario 3)'
);

-- Finally, create the send_earn_create record, which should trigger the referral creation
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
    floor(extract(EPOCH FROM timestamptz '2024-01-01 14:20:00')),
    '\xdddd444444444444444444444444444444444444444444444444444444444444', -- Same TX hash as deposit and affiliate
    '\xea5e000000000000000000000000000000000088', -- Send Earn contract address (matches deposit)
    '\x0000000000000000000000000000000000000000',
    '\x0000000000000000000000000000000000000000',
    '\xea5e000000000000000000000000000000000077', -- Vault address
    '\xaff2000000000000000000000000000000000088', -- Fee recipient (matches send_earn_affiliate)
    '\x0000000000000000000000000000000000000000',
    1000, -- Fee basis points (10%)
    '\x0000000000000000000000000000000000000000',
    'send_earn_create',
    'send_earn_create',
    2300,
    0,
    0,
    0
);

-- Verify the referral was created when send_earn_create was indexed
SELECT isnt_empty(
    $$SELECT * FROM referrals
      WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate2')
      AND referred_id = tests.get_supabase_uid('referred_user2')$$,
    'Referral should be created when send_earn_create is indexed last (scenario 3)'
);

-- Verify referral timestamp is set correctly
SELECT ok(
    (SELECT created_at IS NOT NULL
     FROM referrals
     WHERE referrer_id = tests.get_supabase_uid('referrer_affiliate2')
     AND referred_id = tests.get_supabase_uid('referred_user2')),
    'Referral timestamp should be set when created via send_earn_create trigger'
);

SELECT * FROM finish();
ROLLBACK;
