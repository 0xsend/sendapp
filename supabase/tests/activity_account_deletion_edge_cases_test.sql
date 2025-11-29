-- Test suite for edge cases in activity preservation on account deletion
BEGIN;

SELECT plan(11); -- Number of tests (1 setup verification + 10 actual tests)

-- Setup: Create three users with proper UUIDs
INSERT INTO auth.users (id, email, role, created_at, updated_at)
VALUES
    ('55555555-5555-5555-5555-555555555555', 'eve-test-edge@example.com', 'authenticated', now(), now()),
    ('66666666-6666-6666-6666-666666666666', 'frank-test-edge@example.com', 'authenticated', now(), now()),
    ('77777777-7777-7777-7777-777777777777', 'grace-test-edge@example.com', 'authenticated', now(), now());

-- Wait for profile creation
SELECT pg_sleep(0.1);

-- Edge Case 1: Activity with same user as both from_user and to_user (self-transfer)
-- This should be deleted by CASCADE since there's no "other" user
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
VALUES ('send_account_transfers', 'test-self-transfer-edge', '55555555-5555-5555-5555-555555555555', '55555555-5555-5555-5555-555555555555', '{"v": "10"}'::jsonb, now());

-- Edge Case 2: Multiple activities between the same two users
-- Insert 3 transfers from Eve to Frank
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
VALUES
    ('send_account_transfers', 'test-multi-edge-1', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '{"v": "100"}'::jsonb, now()),
    ('send_account_transfers', 'test-multi-edge-2', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '{"v": "200"}'::jsonb, now()),
    ('send_account_transfers', 'test-multi-edge-3', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '{"v": "300"}'::jsonb, now());

-- Edge Case 3: Activity chain involving multiple users
-- Eve → Frank, Frank → Grace, Grace → Eve
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
VALUES
    ('send_account_transfers', 'test-chain-edge-1', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777777', '{"v": "50"}'::jsonb, now()),
    ('send_account_transfers', 'test-chain-edge-2', '77777777-7777-7777-7777-777777777777', '55555555-5555-5555-5555-555555555555', '{"v": "75"}'::jsonb, now());

-- Edge Case 4: Mix of different event types for the same users
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
VALUES
    ('send_account_receives', 'test-receive-edge-eve-frank', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '{"v": "25"}'::jsonb, now()),
    ('temporal_send_account_transfers', 'test-temporal-edge-eve-frank', '55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', '{"v": "30"}'::jsonb, now());

-- Edge Case 5: Activity with NULL from_user_id (already has NULL before deletion)
-- This represents an activity that was already cleaned up from a previous deletion
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
VALUES ('send_account_transfers', 'test-already-null-edge', NULL, '66666666-6666-6666-6666-666666666666', '{"v": "15"}'::jsonb, now());

-- Verify setup: should have 9 activities total for our test
SELECT ok(
    (SELECT COUNT(*) FROM activity WHERE event_id LIKE 'test-%-edge%') = 9,
    'Setup: Should have 9 activity records before deletion'
);

-- Test: Delete Eve
DELETE FROM auth.users WHERE id = '55555555-5555-5555-5555-555555555555';

-- Test 1: Self-transfer should be deleted (no other user involved)
SELECT ok(NOT EXISTS(
    SELECT 1 FROM activity WHERE event_id = 'test-self-transfer-edge'
), 'Test 1: Self-transfer should be deleted (same user for from/to)');

-- Test 2: All three multi-transfers should be preserved with NULL from_user_id
SELECT ok(
    (SELECT COUNT(*) FROM activity
     WHERE event_id IN ('test-multi-edge-1', 'test-multi-edge-2', 'test-multi-edge-3')
       AND from_user_id IS NULL
       AND to_user_id = '66666666-6666-6666-6666-666666666666') = 3,
    'Test 2: All three transfers should be preserved with NULL from_user_id'
);

-- Test 3: Chain activity where Eve was recipient should be preserved
SELECT ok(EXISTS(
    SELECT 1 FROM activity
    WHERE event_id = 'test-chain-edge-2'
      AND from_user_id = '77777777-7777-7777-7777-777777777777'
      AND to_user_id IS NULL
), 'Test 3: Chain activity (Grace → Eve) should be preserved with NULL to_user_id');

-- Test 4: Chain activity between Frank and Grace should remain unchanged
SELECT ok(EXISTS(
    SELECT 1 FROM activity
    WHERE event_id = 'test-chain-edge-1'
      AND from_user_id = '66666666-6666-6666-6666-666666666666'
      AND to_user_id = '77777777-7777-7777-7777-777777777777'
), 'Test 4: Chain activity (Frank → Grace) should remain unchanged');

-- Test 5: Receive event should be preserved
SELECT ok(EXISTS(
    SELECT 1 FROM activity
    WHERE event_id = 'test-receive-edge-eve-frank'
      AND from_user_id IS NULL
      AND to_user_id = '66666666-6666-6666-6666-666666666666'
), 'Test 5: Receive event should be preserved with NULL from_user_id');

-- Test 6: Temporal transfer should be preserved
SELECT ok(EXISTS(
    SELECT 1 FROM activity
    WHERE event_id = 'test-temporal-edge-eve-frank'
      AND from_user_id IS NULL
      AND to_user_id = '66666666-6666-6666-6666-666666666666'
), 'Test 6: Temporal transfer should be preserved with NULL from_user_id');

-- Test 7: Activity with already-NULL from_user should remain unchanged
SELECT ok(EXISTS(
    SELECT 1 FROM activity
    WHERE event_id = 'test-already-null-edge'
      AND from_user_id IS NULL
      AND to_user_id = '66666666-6666-6666-6666-666666666666'
), 'Test 7: Activity with already-NULL from_user should remain unchanged');

-- Test 8: Total activity count for our test should be 8 (9 - 1 self-transfer)
SELECT ok(
    (SELECT COUNT(*) FROM activity WHERE event_id LIKE 'test-%-edge%') = 8,
    'Test 8: Should have 8 activity records after deletion (self-transfer deleted)'
);

-- Test 9: Frank should have 6 activities as to_user (3 multi + 1 receive + 1 temporal + 1 already-null)
SELECT ok(
    (SELECT COUNT(*) FROM activity WHERE to_user_id = '66666666-6666-6666-6666-666666666666' AND event_id LIKE 'test-%-edge%') = 6,
    'Test 9: Frank should have 6 activities as recipient (includes already-null activity)'
);

-- Test 10: Grace should still have her activities unchanged
SELECT ok(
    (SELECT COUNT(*) FROM activity WHERE (from_user_id = '77777777-7777-7777-7777-777777777777' OR to_user_id = '77777777-7777-7777-7777-777777777777') AND event_id LIKE 'test-%-edge%') = 2,
    'Test 10: Grace should still have 2 activities (1 sent, 1 received with NULL)'
);

-- Finish tests
SELECT * FROM finish();

ROLLBACK;
