BEGIN;
SELECT plan(5);

-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers";

-- Create test users
SELECT tests.create_supabase_user('test_user_from');
SELECT tests.create_supabase_user('test_user_to');

-- Setup test accounts
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('test_user_from'),
    '0x1234567890ABCDEF1234567890ABCDEF12345678',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
),
(
    tests.get_supabase_uid('test_user_to'),
    '0xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- Test 1: Test token transfer insertion
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'test-workflow-1',
    'initialized',
    tests.get_supabase_uid('test_user_from'),
    json_build_object(
        'sender', '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea
    )
);

SELECT results_eq(
    $$
    SELECT
        workflow_id,
        status,
        user_id,
        (data->>'sender')::bytea
    FROM temporal.send_account_transfers
    WHERE workflow_id = 'test-workflow-1'
    $$,
    $$
    VALUES (
        'test-workflow-1'::text,
        'initialized'::temporal.transfer_status,
        tests.get_supabase_uid('test_user_from'),
        '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea
    )
    $$,
    'Test token transfer insertion'
);

SELECT is_empty(
    $$
    SELECT * FROM activity WHERE event_id = 'test-workflow-1'
    $$,
    'Test that no activity is inserted during initialization'
);

-- Test 2: Test Token transfer update
UPDATE temporal.send_account_transfers
SET
    status = 'submitted',
    created_at_block_num = 123,
    data = json_build_object(
        'f', '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea,
        't', '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea,
        'v', '100',
        'log_addr', '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'::bytea
    )
WHERE workflow_id = 'test-workflow-1';

SELECT results_eq(
    $$
    SELECT
        workflow_id,
        status,
        created_at_block_num::numeric,
        (data->>'f')::bytea,
        (data->>'t')::bytea,
        data->>'v',
        (data->>'log_addr')::bytea
    FROM temporal.send_account_transfers
    WHERE workflow_id = 'test-workflow-1'
    $$,
    $$
    VALUES (
        'test-workflow-1'::text,
        'submitted'::temporal.transfer_status,
        123::numeric,
        '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea,
        '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea,
        '100'::text,
        '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'::bytea
    )
    $$,
    'Test token transfer update'
);


-- Test 4: Test ETH transfer insertion
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'test-workflow-2',
    'initialized',
    tests.get_supabase_uid('test_user_from'),
    json_build_object(
        'sender', '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea
    )
);

SELECT is_empty(
    $$
    SELECT * FROM activity WHERE event_id = 'test-workflow-2'
    $$,
    'Test that no activity is inserted during initialization'
);


-- Test 5: Test update ETH transfer
UPDATE temporal.send_account_transfers
SET
    status = 'submitted',
    created_at_block_num = 123,
    data = data || json_build_object(
        'log_addr', '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea,
        'value', '10'
    )::jsonb
WHERE workflow_id = 'test-workflow-2';

SELECT results_eq(
    $$
    SELECT
        workflow_id,
        status,
        created_at_block_num::numeric,
        (data->>'sender')::bytea,
        (data->>'log_addr')::bytea,
        data->>'value'
    FROM temporal.send_account_transfers
    WHERE workflow_id = 'test-workflow-2'
    $$,
    $$
    VALUES (
        'test-workflow-2'::text,
        'submitted'::temporal.transfer_status,
        123::numeric,
        '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea,
        '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea,
        '10'::text
    )
    $$,
    'Test ETH transfer update'
);

SELECT * FROM finish();
ROLLBACK;

--@TODO test activity triggers