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

-- Test 1: Primary lookup works (existing behavior)
-- First, create temporal record with activity event_id/event_name linked
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    send_account_transfers_activity_event_id,
    send_account_transfers_activity_event_name,
    data
) VALUES (
    'test-workflow-primary-1',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    'test-event-id-primary',
    'send_account_transfers',
    jsonb_build_object(
        'note', 'Primary lookup note',
        'tx_hash', '0xdeadbeef123456789abcdef0123456789abcdef0123456789abcdef0123456789'
    )
);

-- Now insert activity record - should find note via primary lookup
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'test-event-id-primary',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'test-event-id-primary'),
    'Primary lookup note',
    'Test primary lookup works - note found by exact event_id/event_name match'
);

-- Test 2: Fallback lookup works when event_id/event_name not linked yet (race condition scenario)
-- Create temporal record without activity event_id/event_name linked (race condition scenario)
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'test-workflow-fallback-2',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Fallback lookup note',
        'tx_hash', '0xabcdef123456789deadbeef0123456789abcdef0123456789abcdef0123456789'
    )
);

-- Insert activity record where event_id contains the workflow_id (typical pattern)
-- This simulates the race condition where blockchain indexer creates activity before workflow sets event links
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'blockchain-event-test-workflow-fallback-2-something',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'blockchain-event-test-workflow-fallback-2-something'),
    'Fallback lookup note',
    'Test fallback lookup works - note found by workflow_id pattern match'
);

-- Test 3: Fallback lookup picks most recent record when multiple matches
-- Create two temporal records with same workflow_id pattern
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data,
    updated_at
) VALUES (
    'test-workflow-multi-3a',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Older note',
        'tx_hash', '0x1111111111111111111111111111111111111111111111111111111111111111'
    ),
    NOW() - INTERVAL '1 hour'
),
(
    'test-workflow-multi-3b',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Newer note',
        'tx_hash', '0x2222222222222222222222222222222222222222222222222222222222222222'
    ),
    NOW()
);

-- Insert activity that matches both workflow IDs (containing 'test-workflow-multi-3')
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'blockchain-event-test-workflow-multi-3-combined',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'blockchain-event-test-workflow-multi-3-combined'),
    'Newer note',
    'Test fallback lookup picks most recent record with ORDER BY updated_at DESC LIMIT 1'
);

-- Test 4: No note found if no tx_hash present (safety check)
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'test-workflow-no-tx-4',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Should not be found'
    )  -- No tx_hash
);

INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'blockchain-event-test-workflow-no-tx-4-something',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'blockchain-event-test-workflow-no-tx-4-something'),
    NULL,
    'Test safety check - no note found when tx_hash is missing'
);

-- Test 5: Primary lookup takes precedence over fallback
-- Create temporal record with both primary link and fallback-matchable workflow_id
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    send_account_transfers_activity_event_id,
    send_account_transfers_activity_event_name,
    data
) VALUES (
    'test-workflow-precedence-5',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    'exact-event-precedence',
    'send_account_transfers',
    jsonb_build_object(
        'note', 'Primary wins',
        'tx_hash', '0x3333333333333333333333333333333333333333333333333333333333333333'
    )
);

-- Create another temporal record with different note but same workflow_id pattern
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'test-workflow-precedence-5-alternative',
    'confirmed',
    tests.get_supabase_uid('test_user_from'),
    jsonb_build_object(
        'note', 'Fallback note',
        'tx_hash', '0x4444444444444444444444444444444444444444444444444444444444444444'
    )
);

-- Insert activity that has exact match AND workflow_id pattern match
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_transfers',
    'exact-event-precedence',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'exact-event-precedence'),
    'Primary wins',
    'Test primary lookup takes precedence over fallback when both could match'
);

-- Test 6: Function works for both send_account_transfers AND send_account_receives events
INSERT INTO temporal.send_account_transfers (
    workflow_id,
    status,
    user_id,
    data
) VALUES (
    'test-workflow-receives-6',
    'confirmed',
    tests.get_supabase_uid('test_user_to'),
    jsonb_build_object(
        'note', 'Receive note',
        'tx_hash', '0x5555555555555555555555555555555555555555555555555555555555555555'
    )
);

INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES (
    'send_account_receives',  -- Testing receives event type
    'blockchain-event-test-workflow-receives-6-something',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{}'::jsonb
);

SELECT is(
    (SELECT data->>'note' FROM activity WHERE event_id = 'blockchain-event-test-workflow-receives-6-something'),
    'Receive note',
    'Test function works for send_account_receives events too'
);

SELECT * FROM finish();
ROLLBACK;
