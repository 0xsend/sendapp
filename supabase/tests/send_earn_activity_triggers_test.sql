-- Tests for send_earn activity triggers
BEGIN;
SELECT plan(8);

-- Create the necessary extensions
CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Test setup: Create test data
DO $$
DECLARE
    v_test_address citext := '0xabcdef1234567890abcdef1234567890abcdef12';
    v_test_owner bytea := decode('abcdef1234567890abcdef1234567890abcdef12', 'hex');
    v_test_sender bytea := decode('1234567890abcdef', 'hex');
    v_test_vault bytea := decode('9876543210abcdef', 'hex');
    v_test_receiver bytea := decode('fedcba0987654321', 'hex');
    v_tx_hash bytea := decode('aabbccddeeff00112233445566778899', 'hex');
    v_test_user_id uuid;
BEGIN
    -- Create test user and send account
    INSERT INTO auth.users (id, email)
    VALUES (gen_random_uuid(), 'test-user@example.com')
    RETURNING id INTO v_test_user_id;

    -- Add send_account_created entry (required by the filter trigger)
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
    ) VALUES (
        1,
        '\x1111111111111111111111111111111111111111',
        123456789,
        '\x2222222222222222222222222222222222222222222222222222222222222222',
        '\x3333333333333333333333333333333333333333333333333333333333333333',
        v_test_owner,
        'test',
        'test',
        12344,
        0,
        0
    );

    INSERT INTO send_accounts (user_id, address, chain_id, init_code, created_at, updated_at)
    VALUES (v_test_user_id, v_test_address, 1, decode('00', 'hex'), NOW(), NOW());

    -- Insert test deposit
    INSERT INTO send_earn_deposit (
        chain_id, log_addr, block_time, tx_hash, sender, owner, assets, shares,
        ig_name, src_name, block_num, tx_idx, log_idx, abi_idx
    ) VALUES (
        1, v_test_vault, 123456789, v_tx_hash, v_test_sender, v_test_owner,
        1000000000000000000, 950000000000000000,
        'test', 'test', 12345, 0, 0, 0
    );

    -- Insert test withdraw
    INSERT INTO send_earn_withdraw (
        chain_id, log_addr, block_time, tx_hash, sender, receiver, owner, assets, shares,
        ig_name, src_name, block_num, tx_idx, log_idx, abi_idx
    ) VALUES (
        1, v_test_vault, 123456790, v_tx_hash, v_test_sender, v_test_receiver, v_test_owner,
        500000000000000000, 475000000000000000,
        'test', 'test', 12346, 0, 0, 0
    );
END $$;

-- Test: Verify that the triggers created activity entries
SELECT isnt_empty(
    $$SELECT * FROM activity WHERE event_name = 'send_earn_deposit'$$,
    'Trigger for send_earn_deposit should create activity entries'
);

SELECT isnt_empty(
    $$SELECT * FROM activity WHERE event_name = 'send_earn_withdraw'$$,
    'Trigger for send_earn_withdraw should create activity entries'
);

-- Test: Verify that the correct user ID was set in the activity entries
SELECT isnt_empty(
    $$SELECT * FROM activity a
      JOIN send_accounts sa ON a.from_user_id = sa.user_id
      WHERE event_name = 'send_earn_deposit'
      AND sa.address = '0xabcdef1234567890abcdef1234567890abcdef12'::citext$$,
    'Deposit activity should have correct user_id'
);

SELECT isnt_empty(
    $$SELECT * FROM activity a
      JOIN send_accounts sa ON a.from_user_id = sa.user_id
      WHERE event_name = 'send_earn_withdraw'
      AND sa.address = '0xabcdef1234567890abcdef1234567890abcdef12'::citext$$,
    'Withdraw activity should have correct user_id'
);

-- Ensure we know what activity entries we're working with
-- SELECT diag('Activity entries before deletion:');
-- SELECT diag(event_name || ' | ' || event_id)
-- FROM activity
-- WHERE event_name IN ('send_earn_deposit', 'send_earn_withdraw');

-- Store event_ids for verification
DO $$
DECLARE
    deposit_event_id text;
    withdraw_event_id text;
BEGIN
    -- Get the event IDs for our test entries
    SELECT event_id INTO deposit_event_id FROM send_earn_deposit
    WHERE ig_name = 'test' AND src_name = 'test' LIMIT 1;

    SELECT event_id INTO withdraw_event_id FROM send_earn_withdraw
    WHERE ig_name = 'test' AND src_name = 'test' LIMIT 1;

    -- Log for debugging
    -- RAISE NOTICE 'Deposit event_id: %', deposit_event_id;
    -- RAISE NOTICE 'Withdraw event_id: %', withdraw_event_id;
END $$;

-- Clean up any existing activity entries for other events before testing deletion
-- This ensures we're only testing our specific test entries
DELETE FROM activity
WHERE event_name = 'send_earn_withdraw'
AND event_id NOT IN (
    SELECT event_id FROM send_earn_withdraw WHERE ig_name = 'test' AND src_name = 'test'
);

-- Test: Verify delete triggers work correctly
-- First verify we have the activity entries to delete
SELECT isnt_empty(
    $$SELECT * FROM activity WHERE event_name = 'send_earn_deposit'$$,
    'Should have send_earn_deposit activity entries before deletion'
);

SELECT isnt_empty(
    $$SELECT * FROM activity WHERE event_name = 'send_earn_withdraw'$$,
    'Should have send_earn_withdraw activity entries before deletion'
);

-- Now delete the test entries
DELETE FROM send_earn_deposit WHERE ig_name = 'test' AND src_name = 'test';
DELETE FROM send_earn_withdraw WHERE ig_name = 'test' AND src_name = 'test';

-- Verify the activity entries were removed by the triggers
SELECT is_empty(
    $$SELECT * FROM activity WHERE event_name = 'send_earn_deposit'$$,
    'Delete trigger should remove send_earn_deposit activity entries'
);

SELECT is_empty(
    $$SELECT * FROM activity WHERE event_name = 'send_earn_withdraw'$$,
    'Delete trigger should remove send_earn_withdraw activity entries'
);

-- Clean up
DELETE FROM send_accounts WHERE address = '0xabcdef1234567890abcdef1234567890abcdef12'::citext;

-- Finish the test
SELECT * FROM finish();
ROLLBACK;
