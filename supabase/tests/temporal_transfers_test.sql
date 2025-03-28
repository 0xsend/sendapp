BEGIN;
SELECT plan(6);

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
    created_at_block_num,
    data
) VALUES (
    'test-workflow-1',
    'initialized',
    123,
    json_build_object(
        'f', '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea,
        't', '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea,
        'v', '100',
        'log_addr', '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'::bytea
    )
);

SELECT results_eq(
    $$
    SELECT
        workflow_id,
        status,
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
        'initialized'::temporal.transfer_status,
        '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea,
        '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea,
        '100'::text,
        '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'::bytea
    )
    $$,
    'Test token transfer insertion'
);

-- Test 2: Test ETH transfer insertion
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    created_at_block_num,
    data
) VALUES (
    'test-workflow-2',
    'initialized',
    123,
    json_build_object(
        'sender', '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea,
        'log_addr', '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'::bytea,
        'value', '1000000000000000000'
    )
);

SELECT results_eq(
    $$
    SELECT
        workflow_id,
        status,
        (data->>'sender')::bytea,
        (data->>'log_addr')::bytea,
        data->>'value'
    FROM temporal.send_account_transfers
    WHERE workflow_id = 'test-workflow-2'
    $$,
    $$
    VALUES (
        'test-workflow-2'::text,
        'initialized'::temporal.transfer_status,
        '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea,
        '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'::bytea,
        '1000000000000000000'::text
    )
    $$,
    'Test ETH transfer insertion'
);

-- Test 3: Test update
UPDATE temporal.send_account_transfers
SET
    status = 'sent',
    data = data || json_build_object(
        'user_op_hash', '\x1234'::bytea,
        'tx_hash', '\x5678'::bytea,
        'block_num', '123'
    )::jsonb
WHERE workflow_id = 'test-workflow-1';

SELECT results_eq(
    $$
    SELECT
        status,
        (data->>'user_op_hash')::bytea,
        (data->>'tx_hash')::bytea,
        data->>'block_num'
    FROM temporal.send_account_transfers
    WHERE workflow_id = 'test-workflow-1'
    $$,
    $$
    VALUES (
        'sent'::temporal.transfer_status,
        '\x1234'::bytea,
        '\x5678'::bytea,
        '123'::text
    )
    $$,
    'Test transfer update'
);

-- Test 4: Test activity insertion trigger for token transfer
SELECT results_eq(
    $$
    SELECT
        event_name,
        from_user_id,
        to_user_id,
        (data->>'f')::bytea,
        (data->>'t')::bytea,
        data->>'v'
    FROM activity
    WHERE event_id = 'test-workflow-1'
    $$,
    $$
    VALUES (
        'temporal_send_account_transfers'::text,
        tests.get_supabase_uid('test_user_from'),
        tests.get_supabase_uid('test_user_to'),
        '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea,
        '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea,
        '100'::text
    )
    $$,
    'Test activity insertion for token transfer'
);

-- Test 5: Test activity insertion trigger for ETH transfer
SELECT results_eq(
    $$
    SELECT
        event_name,
        from_user_id,
        to_user_id,
        (data->>'sender')::bytea,
        data->>'value'
    FROM activity
    WHERE event_id = 'test-workflow-2'
    $$,
    $$
    VALUES (
        'temporal_send_account_transfers'::text,
        tests.get_supabase_uid('test_user_from'),
        NULL::uuid,
        '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea,
        '1000000000000000000'::text
    )
    $$,
    'Test activity insertion for ETH transfer'
);

-- Test 6: Test activity update trigger
SELECT results_eq(
    $$
    SELECT
        (data->>'user_op_hash')::bytea,
        (data->>'tx_hash')::bytea,
        data->>'block_num'
    FROM activity
    WHERE event_id = 'test-workflow-1'
    $$,
    $$
    VALUES (
        '\x1234'::bytea,
        '\x5678'::bytea,
        '123'::text
    )
    $$,
    'Test activity update'
);

SELECT * FROM finish();
ROLLBACK;

--@TODO test activity triggers