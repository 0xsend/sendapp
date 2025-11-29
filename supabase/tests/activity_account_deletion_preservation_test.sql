-- Test suite for activity preservation on account deletion
-- Tests the preserve_activity_before_user_deletion trigger
BEGIN;

SELECT plan(12); -- Number of tests

-- Setup: Create two users with proper UUIDs
INSERT INTO auth.users (id, email, role, created_at, updated_at)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'alice-test-preserve@example.com', 'authenticated', now(), now()),
    ('22222222-2222-2222-2222-222222222222', 'bob-test-preserve@example.com', 'authenticated', now(), now());

-- Supabase trigger should create profiles automatically
-- Wait a moment for triggers to complete
SELECT pg_sleep(0.1);

-- Verify profiles were created
SELECT ok(
    (SELECT COUNT(*) FROM profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')) = 2,
    'Setup: Both user profiles should be created'
);

-- Test Case 1: Multi-user activity (transfer) - should preserve with NULL
-- Insert a transfer from Alice to Bob
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
VALUES ('send_account_transfers', 'test-transfer-preserve-1', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '{"v": "100", "coin": "usdc"}'::jsonb, now());

-- Test Case 2: Multi-user activity (receive) - should preserve with NULL
-- Insert a receive where Alice is the recipient
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
VALUES ('send_account_receives', 'test-receive-preserve-1', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '{"v": "50", "coin": "eth"}'::jsonb, now());

-- Test Case 3: Solo activity (tag purchase) - should be deleted by CASCADE
-- Insert a tag purchase by Alice (only from_user, no to_user)
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
VALUES ('tag_receipt_usdc', 'test-tag-preserve-1', '11111111-1111-1111-1111-111111111111', NULL, '{}'::jsonb, now());

-- Test Case 4: Solo activity (earn deposit) - should be deleted by CASCADE
-- Insert an earn deposit by Alice
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
VALUES ('send_earn_deposit', 'test-earn-preserve-1', '11111111-1111-1111-1111-111111111111', NULL, '{}'::jsonb, now());

-- Test Case 5: Temporal transfer - should preserve with NULL
-- Insert a temporal transfer from Alice to Bob
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
VALUES ('temporal_send_account_transfers', 'test-temporal-preserve-1', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '{"v": "25"}'::jsonb, now());

-- Test Case 6: Referral - will be tested separately (handled by CASCADE chain)
-- Note: We don't test referrals here as they have their own CASCADE + trigger chain

-- Verify all activities exist before deletion
SELECT ok(
    (SELECT COUNT(*) FROM activity WHERE event_id IN ('test-transfer-preserve-1', 'test-receive-preserve-1', 'test-tag-preserve-1', 'test-earn-preserve-1', 'test-temporal-preserve-1')) = 5,
    'Setup: All 5 activity rows should exist before deletion'
);

-- Delete Alice's account
DELETE FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111';

-- Test 1: Transfer preserved with NULL from_user_id (Alice was sender)
SELECT ok(EXISTS(
    SELECT 1 FROM activity
    WHERE event_id = 'test-transfer-preserve-1'
      AND from_user_id IS NULL
      AND to_user_id = '22222222-2222-2222-2222-222222222222'
), 'Test 1: Transfer activity preserved with NULL from_user_id (sender deleted)');

-- Test 2: Verify the transfer data is intact
SELECT ok(
    (SELECT data->>'v' FROM activity WHERE event_id = 'test-transfer-preserve-1') = '100',
    'Test 2: Transfer data should remain intact after deletion'
);

-- Test 3: Receive preserved with NULL to_user_id (Alice was recipient)
SELECT ok(EXISTS(
    SELECT 1 FROM activity
    WHERE event_id = 'test-receive-preserve-1'
      AND from_user_id = '22222222-2222-2222-2222-222222222222'
      AND to_user_id IS NULL
), 'Test 3: Receive activity preserved with NULL to_user_id (recipient deleted)');

-- Test 4: Tag purchase deleted (solo activity)
SELECT ok(NOT EXISTS(
    SELECT 1 FROM activity WHERE event_id = 'test-tag-preserve-1'
), 'Test 4: Tag purchase deleted (was solo activity)');

-- Test 5: Earn deposit deleted (solo activity)
SELECT ok(NOT EXISTS(
    SELECT 1 FROM activity WHERE event_id = 'test-earn-preserve-1'
), 'Test 5: Earn deposit deleted (was solo activity)');

-- Test 6: Temporal transfer preserved with NULL
SELECT ok(EXISTS(
    SELECT 1 FROM activity
    WHERE event_id = 'test-temporal-preserve-1'
      AND from_user_id IS NULL
      AND to_user_id = '22222222-2222-2222-2222-222222222222'
), 'Test 6: Temporal transfer preserved with NULL from_user_id');

-- Test 7: Bob still exists and has his activities
SELECT ok(
    (SELECT COUNT(*) FROM activity WHERE to_user_id = '22222222-2222-2222-2222-222222222222' OR from_user_id = '22222222-2222-2222-2222-222222222222') = 3,
    'Test 7: Bob still has 3 activity records (2 as to_user, 1 as from_user)'
);

-- Test 8: Total activity count for our test events should be 3 (2 transfers + 1 receive, all preserved for Bob)
SELECT ok(
    (SELECT COUNT(*) FROM activity WHERE event_id LIKE 'test-%-preserve-%') = 3,
    'Test 8: Total activity count should be 3 (preserved multi-user activities only)'
);

-- Test 9: Alice's profile should be deleted (CASCADE from auth.users)
SELECT ok(NOT EXISTS(
    SELECT 1 FROM profiles WHERE id = '11111111-1111-1111-1111-111111111111'
), 'Test 9: Alice profile should be deleted by CASCADE');

-- Test 10: Bob's profile should still exist
SELECT ok(EXISTS(
    SELECT 1 FROM profiles WHERE id = '22222222-2222-2222-2222-222222222222'
), 'Test 10: Bob profile should still exist');

-- Finish tests
SELECT * FROM finish();

ROLLBACK;
