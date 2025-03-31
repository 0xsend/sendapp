-- Start transaction and plan tests
BEGIN;

SELECT plan(16); -- Adjust count as tests are added/refined

-- Test Setup: Create a user and a send account
-- Note: Using fixed UUIDs and addresses for deterministic testing
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'testuser@example.com', '{}');
-- Insert the send account directly, including required chain_id and init_code (chain_addresses not needed)
INSERT INTO public.send_accounts (user_id, address, chain_id, init_code) VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 8453, '\x') ON CONFLICT DO NOTHING;

-- Test Case 1: Verify table structure and basic constraints
SELECT has_table('temporal', 'send_earn_deposits', 'Table temporal.send_earn_deposits should exist.');
SELECT has_column('temporal', 'send_earn_deposits', 'workflow_id', 'Column workflow_id should exist.');
SELECT col_is_pk('temporal', 'send_earn_deposits', 'workflow_id', 'Column workflow_id should be the primary key.');
SELECT col_is_fk('temporal', 'send_earn_deposits', 'activity_id', 'Column activity_id should be a foreign key to public.activity.');
SELECT has_index('temporal', 'send_earn_deposits', 'idx_temporal_send_earn_deposits_tx_hash', 'Index on tx_hash should exist.');
SELECT has_index('temporal', 'send_earn_deposits', 'idx_temporal_send_earn_deposits_owner', 'Index on owner should exist.');

-- Test Case 2: Test the AFTER INSERT trigger for pending activity creation
-- Prepare data for insert
SELECT lives_ok(
    $$
        INSERT INTO temporal.send_earn_deposits (workflow_id, status, owner, assets, vault)
        VALUES (
            'test-workflow-1',
            'initialized',
            '\x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', -- owner
            1000000, -- assets (1 USDC)
            '\x42cd8732570621c426f55aC16dB1e2997086817a' -- vault
        );
    $$,
    'Insert into temporal.send_earn_deposits should succeed.'
);

-- Verify pending activity record was created
SELECT results_eq(
    $$ SELECT event_name FROM public.activity WHERE event_id = 'test-workflow-1' $$,
    $$ VALUES ('temporal_send_earn_deposit'::text) $$,
    'Pending activity record should be created in public.activity.'
);

-- Verify activity_id was updated in temporal.send_earn_deposits
SELECT ok(
    (SELECT activity_id IS NOT NULL FROM temporal.send_earn_deposits WHERE workflow_id = 'test-workflow-1'),
    'activity_id should be updated in temporal.send_earn_deposits.'
);

-- Verify data in pending activity record
SELECT is(
    (SELECT data->>'owner' FROM public.activity WHERE event_id = 'test-workflow-1'),
    '\x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed', -- Lowercase hex without 0x
    'Pending activity data should contain correct owner.'
);
SELECT is(
    (SELECT data->>'workflow_id' FROM public.activity WHERE event_id = 'test-workflow-1'),
    'test-workflow-1',
    'Pending activity data should contain correct workflow_id.'
);


-- Test Case 3: Test the cleanup logic in the modified send_earn_deposit trigger
-- Prepare data: Insert another temporal record and its corresponding send_earn_deposit
SELECT lives_ok(
    $$
        INSERT INTO temporal.send_earn_deposits (workflow_id, status, owner, assets, vault, tx_hash)
        VALUES (
            'test-workflow-2',
            'sent',
            '\x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', -- owner
            1000000, -- assets (1 USDC)
            '\x42cd8732570621c426f55aC16dB1e2997086817a', -- vault
            '\x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' -- example tx_hash
        );
    $$,
    'Insert second temporal record should succeed.'
);

-- Simulate the insertion of the corresponding send_earn_deposit event
-- Ensure the aaa_filter trigger doesn't block this if send_account_created doesn't exist yet
-- For testing, we assume send_account_created exists or the filter trigger is disabled/modified for the test run.
-- If needed, insert into send_account_created:
INSERT INTO public.send_account_created (account, chain_id, block_num, tx_hash, ig_name, src_name, tx_idx, log_idx, block_time, log_addr)
VALUES ('\x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', 8453, 1, '\x00', 'test', 'test', 0, 0, 0, '\x00') -- Removed generated column event_id
ON CONFLICT DO NOTHING;

SELECT lives_ok(
    $$
        INSERT INTO public.send_earn_deposit (
            chain_id, log_addr, block_time, tx_hash, sender, owner, assets, shares,
            ig_name, src_name, block_num, tx_idx, log_idx, abi_idx
        ) VALUES (
            8453, -- chain_id (Base mainnet)
            '\x42cd8732570621c426f55aC16dB1e2997086817a', -- log_addr (vault)
            extract(epoch from now()), -- block_time
            '\x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', -- matching tx_hash
            '\x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', -- sender
            '\x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', -- owner
            200000000, -- assets (e.g., 200 USDC with 6 decimals)
            200000000, -- shares (assuming 1:1 for simplicity)
            'test_ig', 'test_src', 1000, 10, 5, 0 -- dummy event details
        );
    $$,
    'Insert into public.send_earn_deposit should succeed and trigger cleanup.'
);

-- Verify the 'temporal_send_earn_deposit' activity for workflow-2 was deleted
SELECT results_eq(
    $$ SELECT count(*)::int FROM public.activity WHERE event_id = 'test-workflow-2' AND event_name = 'temporal_send_earn_deposit' $$,
    $$ VALUES (0) $$,
    'Pending activity record for workflow-2 should be deleted after send_earn_deposit insert.'
);

-- Verify the final 'send_earn_deposit' activity record exists
SELECT results_ne(
    $$ SELECT count(*)::int FROM public.activity WHERE event_name = 'send_earn_deposit' AND data->>'tx_hash' = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' $$,
    $$ VALUES (0) $$,
    'Final send_earn_deposit activity record should exist.'
);


-- Finish the tests
SELECT * FROM finish();

ROLLBACK; -- Rollback changes made by tests
