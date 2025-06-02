BEGIN;
SELECT plan(15);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Setup test users and send accounts
SELECT tests.create_supabase_user('lifecycle_user1');
SELECT tests.create_supabase_user('lifecycle_user2');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('lifecycle_user1'), '0x1111111111111111111111111111111111111111', 8453, '\\x00');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('lifecycle_user2'), '0x2222222222222222222222222222222222222222', 8453, '\\x00');

-- Test 1-4: Complete recycling lifecycle (confirmed → deleted → available → reclaimed)
SELECT tests.authenticate_as('lifecycle_user1');

-- Create and confirm two tags (need at least 2 to test deletion with constraint)
SELECT create_tag('recyclable_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1')));
SELECT create_tag('keepable_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1')));

SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name IN ('recyclable_tag', 'keepable_tag');
SET ROLE postgres;

-- Test 1: Tag is confirmed and owned by user1
SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON t.id = sat.tag_id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE t.name = 'recyclable_tag' 
    AND t.status = 'confirmed' 
    AND sa.user_id = tests.get_supabase_uid('lifecycle_user1')
), 'Tag is confirmed and owned by user1');

-- Delete the tag association (simulating user releasing the tag)
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'recyclable_tag')
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1'));

-- Test 2: Tag becomes available after deletion (status and user_id cleared)
SELECT ok(EXISTS(
    SELECT 1 FROM tags 
    WHERE name = 'recyclable_tag' 
    AND status = 'available' 
    AND user_id IS NULL
), 'Tag becomes available and user_id is cleared after deletion');

-- Test 3: Tag can be reclaimed by another user
SELECT tests.authenticate_as('lifecycle_user2');
SELECT create_tag('recyclable_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user2')));

SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON t.id = sat.tag_id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE t.name = 'recyclable_tag' 
    AND t.status = 'pending'
    AND sa.user_id = tests.get_supabase_uid('lifecycle_user2')
), 'Tag can be reclaimed by another user');

-- Test 4: Confirm reclaimed tag completes the cycle
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name = 'recyclable_tag' AND user_id = tests.get_supabase_uid('lifecycle_user2');
SET ROLE postgres;

SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON t.id = sat.tag_id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE t.name = 'recyclable_tag' 
    AND t.status = 'confirmed'
    AND sa.user_id = tests.get_supabase_uid('lifecycle_user2')
), 'Reclaimed tag can be confirmed completing the cycle');

-- Test 5-8: Main tag succession preserves oldest-first order
SELECT tests.authenticate_as('lifecycle_user1');

-- Create multiple tags with known order (using slight delay to ensure ordering)
SELECT create_tag('oldest_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1')));
SELECT pg_sleep(0.01); -- Small delay to ensure creation time difference
SELECT create_tag('middle_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1')));
SELECT pg_sleep(0.01);
SELECT create_tag('newest_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1')));

-- Confirm all tags in order (oldest first)
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name = 'oldest_tag';
UPDATE tags SET status = 'confirmed' WHERE name = 'middle_tag';  
UPDATE tags SET status = 'confirmed' WHERE name = 'newest_tag';
SET ROLE postgres;

-- Test 5: Main tag remains the first confirmed tag (keepable_tag)
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('lifecycle_user1')
    AND t.name = 'keepable_tag'
), 'Main tag remains the first confirmed tag');

-- Test 6: Delete main tag (keepable_tag), oldest_tag should become main  
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'keepable_tag')
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1'));

SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('lifecycle_user1')
    AND t.name = 'oldest_tag'
), 'Oldest remaining tag becomes main after current main is deleted');

-- Test 7: Delete current main tag (oldest_tag), middle_tag should become main
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'oldest_tag')
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1'));

SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('lifecycle_user1')
    AND t.name = 'middle_tag'
), 'Middle tag becomes main after oldest tag is deleted');

-- Delete middle_tag to make newest_tag the last confirmed tag
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'middle_tag')
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1'));

-- Test 8: Cannot delete the last confirmed tag (constraint prevents it)
SELECT throws_ok(
    $$ DELETE FROM send_account_tags 
       WHERE tag_id = (SELECT id FROM tags WHERE name = 'newest_tag')
       AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1')) $$,
    'P0001',
    'Cannot delete your last confirmed sendtag. Users must maintain at least one confirmed sendtag.'
);

-- Test 9: User still has their last confirmed tag and main_tag_id is not NULL
SELECT ok((
    SELECT main_tag_id FROM send_accounts 
    WHERE user_id = tests.get_supabase_uid('lifecycle_user1')
) IS NOT NULL, 'Main tag remains set since last confirmed tag cannot be deleted');

-- Test 10: User can still create additional new tags
SELECT create_tag('fresh_start', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1')));

SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON t.id = sat.tag_id
    WHERE t.name = 'fresh_start' AND t.status = 'pending'
), 'User can create additional new tags while keeping confirmed ones');

-- Test 11: Confirming additional tag does not change main tag (first remains main)
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name = 'fresh_start';
SET ROLE postgres;

SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('lifecycle_user1')
    AND t.name = 'newest_tag'  -- Original main tag should remain
), 'Main tag remains the first confirmed tag even when additional tags are confirmed');

-- Test 12-15: Complex succession scenarios
-- Create tags with specific timing to test succession order
SELECT create_tag('succession_a', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1')));
SELECT pg_sleep(0.01);
SELECT create_tag('succession_b', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1')));
SELECT pg_sleep(0.01);
SELECT create_tag('succession_c', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1')));

-- Confirm in reverse order to test that succession still follows creation order
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name = 'succession_c';
UPDATE tags SET status = 'confirmed' WHERE name = 'succession_b';
UPDATE tags SET status = 'confirmed' WHERE name = 'succession_a';
SET ROLE postgres;

-- Test 12: Main tag should still be newest_tag, not affected by later confirmations
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('lifecycle_user1')
    AND t.name = 'newest_tag'  -- Main tag should remain unchanged
), 'Main tag remains unchanged when additional tags are confirmed');

-- Test 13: Deleting non-main tag doesn't affect main tag
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'fresh_start')
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1'));

SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('lifecycle_user1')
    AND t.name = 'newest_tag'  -- Main tag should remain unchanged
), 'Deleting non-main tag does not affect main tag');

-- Test 14: Tags deleted out of order still maintain proper succession
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'succession_b')  -- Delete middle tag
AND send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user1'));

SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('lifecycle_user1')
    AND t.name = 'newest_tag'  -- Main tag should remain unchanged
), 'Deleting non-main tags does not affect main tag');

-- Test 15: Final cleanup leaves system in valid state
SELECT ok(
    (SELECT COUNT(*) FROM send_account_tags sat 
     JOIN send_accounts sa ON sa.id = sat.send_account_id 
     WHERE sa.user_id = tests.get_supabase_uid('lifecycle_user1')) >= 1,
    'User still has at least one tag association after all operations'
);

SELECT * FROM finish();
ROLLBACK;