BEGIN;
SELECT plan(12);

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
    '\x00112233445566778899AABBCCDDEEFF'
),
(
    tests.get_supabase_uid('test_user_to'),
    '0xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA',
    1,
    '\x00112233445566778899AABBCCDDEEFF'
);

-- Test 1: Enhanced primary lookup works correctly
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    send_account_transfers_activity_event_id,
    send_account_transfers_activity_event_name,
    data
) VALUES (
    'temporal/transfer/user-123/0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    'test-event-id-primary-enhanced',
    'send_account_transfers',
    jsonb_build_object(
        'note', 'Enhanced primary lookup note',
        'tx_hash', '0xdeadbeef123456789abcdef0123456789abcdef0123456789abcdef0123456789'
    )
);

INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'test-event-id-primary-enhanced',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'test-event-id-primary-enhanced'),
    'Enhanced primary lookup note',
    'Test enhanced primary lookup works correctly'
);

-- Test 2: Enhanced fallback with valid blockchain event pattern
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'temporal/transfer/user-456/0x1234567890123456789012345678901234567890123456789012345678901234',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Valid blockchain pattern note',
        'tx_hash', '0xabcdef123456789deadbeef0123456789abcdef0123456789abcdef0123456789'
    )
);

-- Insert activity with valid blockchain event pattern containing temporal workflow
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'send_account_transfers/base_logs/12345/0/1',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'send_account_transfers/base_logs/12345/0/1'),
    NULL,  -- Should be NULL due to enhanced validation not matching
    'Test enhanced validation prevents false matches without temporal pattern'
);

-- Test 3: Valid blockchain pattern with temporal pattern works
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'temporal/transfer/user-789/0x9876543210987654321098765432109876543210987654321098765432109876',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Valid temporal pattern note',
        'tx_hash', '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210'
    )
);

-- Insert activity with proper blockchain pattern AND temporal reference
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'temporal/transfer/user-789/0x9876543210987654321098765432109876543210987654321098765432109876/base_logs/12346/0/1',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id LIKE '%temporal/transfer/user-789%'),
    'Valid temporal pattern note',
    'Test enhanced validation works with valid temporal pattern in blockchain event'
);

-- Test 4: Invalid workflow_id format rejected
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'invalid-workflow-format',  -- Invalid format
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Invalid format note',
        'tx_hash', '0x1111111111111111111111111111111111111111111111111111111111111111'
    )
);

INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'send_account_transfers/base_logs/12347/0/1',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'send_account_transfers/base_logs/12347/0/1'),
    NULL,
    'Test invalid workflow_id format is properly rejected'
);

-- Test 5: Note length validation (defensive check)
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    send_account_transfers_activity_event_id,
    send_account_transfers_activity_event_name,
    data
) VALUES (
    'temporal/transfer/user-long/0x5555555555555555555555555555555555555555555555555555555555555555',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    'test-event-id-long-note',
    'send_account_transfers',
    jsonb_build_object(
        'note', REPEAT('x', 1001),  -- Note too long (>1000 chars)
        'tx_hash', '0x5555555555555555555555555555555555555555555555555555555555555555'
    )
);

INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'test-event-id-long-note',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'test-event-id-long-note'),
    NULL,
    'Test note length validation rejects overly long notes'
);

-- Test 6: Empty note validation
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    send_account_transfers_activity_event_id,
    send_account_transfers_activity_event_name,
    data
) VALUES (
    'temporal/transfer/user-empty/0x6666666666666666666666666666666666666666666666666666666666666666',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    'test-event-id-empty-note',
    'send_account_transfers',
    jsonb_build_object(
        'note', '',  -- Empty note
        'tx_hash', '0x6666666666666666666666666666666666666666666666666666666666666666'
    )
);

INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'test-event-id-empty-note',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'test-event-id-empty-note'),
    NULL,
    'Test empty note validation rejects empty notes'
);

-- Test 7: Status validation in fallback lookup
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'temporal/transfer/user-status/0x7777777777777777777777777777777777777777777777777777777777777777',
    'failed',  -- Failed status should be excluded
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Failed status note',
        'tx_hash', '0x7777777777777777777777777777777777777777777777777777777777777777'
    )
);

INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'temporal/transfer/user-status/0x7777777777777777777777777777777777777777777777777777777777777777/base_logs/12348/0/1',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id LIKE '%temporal/transfer/user-status%'),
    NULL,
    'Test status validation excludes failed transfers'
);

-- Test 8: Time-based fallback validation
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data,
    created_at
) VALUES (
    'temporal/transfer/user-old/0x8888888888888888888888888888888888888888888888888888888888888888',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Old workflow note',
        'tx_hash', '0x8888888888888888888888888888888888888888888888888888888888888888'
    ),
    NOW() - INTERVAL '2 hours'  -- Too old
);

INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'send_account_transfers/base_logs/12349/0/1',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'send_account_transfers/base_logs/12349/0/1'),
    NULL,
    'Test time-based validation excludes old workflows in secondary fallback'
);

-- Test 9: Valid user_op_hash extraction and matching
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'temporal/transfer/user-hash/0x9999999999999999999999999999999999999999999999999999999999999999',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Hash extraction note',
        'tx_hash', '0x9999999999999999999999999999999999999999999999999999999999999999'
    )
);

-- Create activity with user_op_hash in event_id (secondary fallback test)
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'send_account_transfers/base_logs/0x9999999999999999999999999999999999999999999999999999999999999999/12350/0/1',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id LIKE '%0x9999999999999999999999999999999999999999999999999999999999999999%'),
    'Hash extraction note',
    'Test user_op_hash extraction works in secondary fallback'
);

-- Test 10: Multiple matches prioritize most recent
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data,
    updated_at
) VALUES 
(
    'temporal/transfer/user-multi1/0xaaaa111111111111111111111111111111111111111111111111111111111111',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Older multi note',
        'tx_hash', '0xaaaa111111111111111111111111111111111111111111111111111111111111'
    ),
    NOW() - INTERVAL '5 minutes'
),
(
    'temporal/transfer/user-multi2/0xaaaa222222222222222222222222222222222222222222222222222222222222',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Newer multi note',
        'tx_hash', '0xaaaa222222222222222222222222222222222222222222222222222222222222'
    ),
    NOW()
);

INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'temporal/transfer/multi-match/base_logs/12351/0/1',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

-- This should not match because the event_id doesn't contain the exact workflow_ids
SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'temporal/transfer/multi-match/base_logs/12351/0/1'),
    NULL,
    'Test enhanced validation prevents false multi-matches'
);

-- Test 11: Function handles send_account_receives events
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    send_account_transfers_activity_event_id,
    send_account_transfers_activity_event_name,
    data
) VALUES (
    'temporal/transfer/user-receive/0xbbbb333333333333333333333333333333333333333333333333333333333333',
    'confirmed',
    tests.get_supabase_uid('test_user_to'),
    'test-event-id-receive-enhanced',
    'send_account_receives',
    jsonb_build_object(
        'note', 'Enhanced receive note',
        'tx_hash', '0xbbbb333333333333333333333333333333333333333333333333333333333333'
    )
);

INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_receives',
    'test-event-id-receive-enhanced',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'test-event-id-receive-enhanced'),
    'Enhanced receive note',
    'Test enhanced function works for send_account_receives events'
);

-- Test 12: Function ignores invalid event patterns completely
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'temporal/transfer/user-invalid-event/0xcccc444444444444444444444444444444444444444444444444444444444444',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Invalid event pattern note',
        'tx_hash', '0xcccc444444444444444444444444444444444444444444444444444444444444'
    )
);

-- Insert activity with invalid blockchain event pattern
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'invalid-blockchain-event-pattern-123',  -- Invalid format
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'invalid-blockchain-event-pattern-123'),
    NULL,
    'Test enhanced validation completely ignores invalid event patterns'
);

SELECT * FROM finish();
ROLLBACK;
