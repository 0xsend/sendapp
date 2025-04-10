-- Test suite for the activity cleanup logic in send_earn_deposit_trigger_insert_activity
BEGIN;

SELECT plan(3); -- Number of tests

-- 1. Setup: Create user, send account, and a pending temporal deposit activity
-- Insert into auth.users first (Supabase trigger should create the profile)
INSERT INTO auth.users (id, email, role, created_at, updated_at)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'test@example.com', 'authenticated', now(), now());
-- Now insert the send account referencing the user ID, including chain_id and init_code
INSERT INTO public.send_accounts (user_id, address, chain_id, init_code) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '0x1111111111111111111111111111111111111111', 8453, decode('', 'hex'));

-- Insert a temporal record first (this will trigger the pending activity creation)
-- Use user_op_hash and block_num instead of tx_hash
INSERT INTO temporal.send_earn_deposits (workflow_id, owner, assets, vault, user_op_hash, block_num)
VALUES (
    'test-cleanup-workflow',
    decode('1111111111111111111111111111111111111111', 'hex'), -- owner
    1000000, -- assets
    decode('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'hex'), -- vault
    decode('0000000000000000000000000000000000000000000000000000000000000000', 'hex'), -- user_op_hash (dummy)
    123450 -- block_num (must be <= the block_num of the public.send_earn_deposit insert below)
);

-- 2. Verification 1: Check if the pending activity record was created
SELECT results_eq(
    $$ SELECT count(*)::int FROM public.activity WHERE event_name = 'temporal_send_earn_deposit' AND event_id = 'test-cleanup-workflow' $$,
    $$ VALUES (1) $$,
    'Test 1: Pending activity record should exist initially'
);

-- 3. Test Case: Insert the corresponding public.send_earn_deposit record
-- First, insert a dummy send_account_created record to satisfy the BEFORE INSERT trigger
INSERT INTO public.send_account_created (
    chain_id, log_addr, block_time, tx_hash, account,
    ig_name, src_name, block_num, tx_idx, log_idx
) VALUES (
    8453, -- chain_id
    decode('DDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD', 'hex'), -- log_addr (dummy)
    extract(epoch from now()) - 10, -- block_time (slightly before deposit)
    decode('2222222222222222222222222222222222222222222222222222222222222222', 'hex'), -- tx_hash (dummy)
    decode('1111111111111111111111111111111111111111', 'hex'), -- account (matches deposit owner)
    'test_ig_create', 'test_src_create', 123455, 0, 5 -- dummy event details (removed extra 0)
);

-- Now insert the public.send_earn_deposit record
-- This should trigger the cleanup logic within private.send_earn_deposit_trigger_insert_activity
INSERT INTO public.send_earn_deposit (
    chain_id, log_addr, block_time, tx_hash, sender, owner, assets, shares,
    ig_name, src_name, block_num, tx_idx, log_idx, abi_idx
) VALUES (
    8453, -- chain_id
    decode('BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 'hex'), -- log_addr (earn contract)
    extract(epoch from now()), -- block_time
    decode('1111111111111111111111111111111111111111111111111111111111111111', 'hex'), -- tx_hash (matches temporal record)
    decode('CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 'hex'), -- sender
    decode('1111111111111111111111111111111111111111', 'hex'), -- owner (matches temporal record)
    1000000, -- assets
    1000000, -- shares
    'test_ig', 'test_src', 123456, 1, 10, 0 -- dummy event details
);

-- 4. Verification 2: Check if the pending activity record was deleted
SELECT results_eq(
    $$ SELECT count(*)::int FROM public.activity WHERE event_name = 'temporal_send_earn_deposit' AND event_id = 'test-cleanup-workflow' $$,
    $$ VALUES (0) $$,
    'Test 2: Pending activity record should be deleted after public deposit insertion'
);

-- 5. Verification 3: Check if the final 'send_earn_deposit' activity record exists
SELECT results_eq(
    $$ SELECT count(*)::int FROM public.activity WHERE event_name = 'send_earn_deposit' AND data ->> 'tx_hash' = decode('1111111111111111111111111111111111111111111111111111111111111111', 'hex')::text $$,
    $$ VALUES (1) $$,
    'Test 3: Final "send_earn_deposit" activity record should exist'
);


-- Finish tests
SELECT * FROM finish();

ROLLBACK;
