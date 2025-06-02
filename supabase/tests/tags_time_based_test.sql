BEGIN;
SELECT plan(10);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Setup test users and send accounts
SELECT tests.create_supabase_user('time_user1');
SELECT tests.create_supabase_user('time_user2');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('time_user1'), '0x1111111111111111111111111111111111111111', 8453, '\\x00');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('time_user2'), '0x2222222222222222222222222222222222222222', 8453, '\\x00');

-- Test 1-3: 30-minute expiration for pending tags
SELECT tests.authenticate_as('time_user1');

-- Create a pending tag
SELECT create_tag('expiring_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1')));

-- Test 1: Tag is initially pending and owned by user1
SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON t.id = sat.tag_id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE t.name = 'expiring_tag' 
    AND t.status = 'pending'
    AND sa.user_id = tests.get_supabase_uid('time_user1')
), 'Tag is initially pending and owned by user1');

-- Simulate tag expiration by cleaning up expired pending tags 
-- (In real scenarios, this would be handled by a background job or cron)
-- First remove the association
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'expiring_tag')
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1'));

-- Update the tag to available status (simulating expiration cleanup)  
UPDATE tags 
SET status = 'available', user_id = NULL, updated_at = NOW()
WHERE name = 'expiring_tag';

-- Test the tag expiration logic by trying to create the same tag name again
-- The create_tag function should handle available tags by reusing them
SELECT tests.authenticate_as('time_user2');
SELECT create_tag('expiring_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user2')));

-- Test 2: Expired pending tag can be claimed by another user
SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON t.id = sat.tag_id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE t.name = 'expiring_tag' 
    AND t.status = 'pending'
    AND sa.user_id = tests.get_supabase_uid('time_user2')
), 'Expired pending tag can be claimed by another user');

-- Test 3: Original user no longer has association with expired tag
SELECT tests.authenticate_as('time_user1');
SELECT ok(NOT EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON t.id = sat.tag_id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE t.name = 'expiring_tag' 
    AND sa.user_id = tests.get_supabase_uid('time_user1')
), 'Original user no longer has association with expired tag');

-- Test 4-6: Main tag succession timing with rapid creation/deletion
SELECT tests.authenticate_as('time_user1');

-- Create multiple tags with precise timing
SELECT create_tag('timing_first', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1')));
SELECT pg_sleep(0.01);  -- 10ms delay
SELECT create_tag('timing_second', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1')));
SELECT pg_sleep(0.01);  -- 10ms delay
SELECT create_tag('timing_third', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1')));

-- Confirm all tags
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name IN ('timing_first', 'timing_second', 'timing_third');
SET ROLE postgres;

-- Test 4: First created tag becomes main (timing-based succession)
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('time_user1')
    AND t.name = 'timing_first'
), 'First created tag becomes main (timing-based succession)');

-- Rapidly delete and recreate tags to test succession timing
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'timing_first')
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1'));

-- Test 5: Second tag becomes main after first is deleted (succession preserves creation order)
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('time_user1')
    AND t.name = 'timing_second'
), 'Second tag becomes main after first is deleted');

-- Rapid deletion and recreation within same transaction
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'timing_second')
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1'));

-- Test 6: Third tag becomes main, showing consistent succession
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('time_user1')
    AND t.name = 'timing_third'
), 'Third tag becomes main showing consistent succession');

-- Test 7-8: Concurrent tag operations timing
-- Simulate near-simultaneous tag creation by multiple users for same tag name
SET ROLE service_role;

-- First, create an available tag that both users might try to claim
INSERT INTO tags (name, status, user_id, created_at, updated_at)
VALUES ('contested_tag', 'available', NULL, NOW(), NOW());

SET ROLE postgres;

-- User1 attempts to claim it
SELECT tests.authenticate_as('time_user1');
SELECT create_tag('contested_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1')));

-- Test 7: User1 successfully claims the available tag
SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON t.id = sat.tag_id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE t.name = 'contested_tag' 
    AND t.status = 'pending'
    AND sa.user_id = tests.get_supabase_uid('time_user1')
), 'User1 successfully claims the available tag');

-- User2 attempts to claim the same tag (should fail since it's now pending for user1)
SELECT tests.authenticate_as('time_user2');
SELECT throws_ok(
    $$ SELECT create_tag('contested_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user2'))) $$,
    'P0001',
    'Tag with same name already exists'
);

-- Test 8: Tag expiration and cleanup works correctly with multiple attempts
-- Clean up the contested tag by removing association and making it available
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'contested_tag');

-- Expire the contested tag and make it available
UPDATE tags 
SET created_at = NOW() - INTERVAL '31 minutes',
    status = 'available',
    user_id = NULL
WHERE name = 'contested_tag';

-- Now user2 should be able to claim it
SELECT create_tag('contested_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user2')));

SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON t.id = sat.tag_id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE t.name = 'contested_tag' 
    AND t.status = 'pending'
    AND sa.user_id = tests.get_supabase_uid('time_user2')
), 'User2 can claim expired tag after expiration');

-- Test 9: Time-based succession with microsecond precision
SELECT tests.authenticate_as('time_user1');

-- Create tags with very small time differences
SELECT create_tag('micro_a', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1')));
SELECT create_tag('micro_b', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1')));
SELECT create_tag('micro_c', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1')));

-- Confirm all at once
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name IN ('micro_a', 'micro_b', 'micro_c');
SET ROLE postgres;

-- The main tag should be the chronologically first created tag (micro_a)
-- Even if they were created in rapid succession
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('time_user1')
    AND t.name = 'micro_a'
), 'Main tag assignment respects microsecond-level creation order');

-- Test 10: Succession order is stable under rapid operations
-- Delete main tag and verify succession happens correctly
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'micro_a')
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('time_user1'));

-- Should promote to micro_b (next in chronological order)
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('time_user1')
    AND t.name = 'micro_b'
), 'Succession order remains stable under rapid operations');

SELECT * FROM finish();
ROLLBACK;