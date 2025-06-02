BEGIN;
SELECT plan(12);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Setup test users and send accounts
SELECT tests.create_supabase_user('security_user1');
SELECT tests.create_supabase_user('security_user2');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('security_user1'), '0x1111111111111111111111111111111111111111', 8453, '\\x00');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('security_user2'), '0x2222222222222222222222222222222222222222', 8453, '\\x00');

-- Create tags for user1
SELECT tests.authenticate_as('security_user1');
SELECT create_tag('user1_pending', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('security_user1')));
SELECT create_tag('user1_confirmed', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('security_user1')));

-- Confirm one tag for user1
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name = 'user1_confirmed';
SET ROLE postgres;

-- Create tags for user2
SELECT tests.authenticate_as('security_user2');
SELECT create_tag('user2_pending', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('security_user2')));
SELECT create_tag('user2_confirmed', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('security_user2')));

-- Confirm one tag for user2
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name = 'user2_confirmed';
SET ROLE postgres;

-- Test 1: User1 cannot see user2's pending tags
SELECT tests.authenticate_as('security_user1');
SELECT ok(NOT EXISTS(
    SELECT 1 FROM tags
    WHERE name = 'user2_pending'
), 'User1 cannot see user2 pending tags');

-- Test 2: User1 cannot see user2's confirmed tags directly
SELECT ok(NOT EXISTS(
    SELECT 1 FROM tags
    WHERE name = 'user2_confirmed'
), 'User1 cannot see user2 confirmed tags directly');

-- Test 3: User1 can only see their own tags
SELECT is((
    SELECT COUNT(*) FROM tags WHERE name IN ('user1_pending', 'user1_confirmed')
), 2::bigint, 'User1 can see their own tags');

-- Test 4: User1 cannot see or update user2's pending tags (RLS prevents access)
SELECT tests.authenticate_as('security_user2');
SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name = 'user2_pending'
), 'User2 can still see their own pending tag (verifying it exists)');

SELECT tests.authenticate_as('security_user1');
UPDATE tags SET name = 'hacked' WHERE name = 'user2_pending';
SELECT tests.authenticate_as('security_user2');
SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name = 'user2_pending'
), 'User1 cannot update user2 pending tags (tag name unchanged)');

-- Test 5: User1 cannot delete user2's pending tags (silently does nothing due to RLS)
DELETE FROM tags WHERE name = 'user2_pending';
SELECT tests.authenticate_as('security_user2');
SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name = 'user2_pending'
), 'User2 pending tag still exists (user1 could not delete it)');

-- Test 6: User1 cannot manage user2's send_account_tags associations
SELECT tests.authenticate_as('security_user1');
DELETE FROM send_account_tags
WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('security_user2'));

SELECT tests.authenticate_as('security_user2');
SELECT ok(EXISTS(
    SELECT 1 FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('security_user2')
), 'User2 still has tag associations (user1 could not delete them)');

-- Test 7: User1 cannot create tags for user2's send account
SELECT tests.authenticate_as('security_user1');
SELECT throws_ok(
    $$ SELECT create_tag('malicious_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('security_user2'))) $$,
    'P0001',
    'User does not own this send_account'
);

-- Test 8: User1 cannot set main_tag_id to user2's tags (validation function prevents it)
SELECT throws_ok(
    $$ UPDATE send_accounts
       SET main_tag_id = (SELECT id FROM tags WHERE name = 'user2_confirmed')
       WHERE user_id = tests.get_supabase_uid('security_user1') $$,
    'P0001',
    'Cannot set main_tag_id to NULL while you have confirmed tags'
);

-- Test 9: Anonymous users cannot see any send_account_tags
SELECT tests.clear_authentication();
SELECT is((
    SELECT COUNT(*) FROM send_account_tags
), 0::bigint, 'Anonymous users cannot see send_account_tags');

-- Test 10: Anonymous users cannot see any pending tags
SELECT is((
    SELECT COUNT(*) FROM tags WHERE status = 'pending'
), 0::bigint, 'Anonymous users cannot see pending tags');

-- Test 11: Anonymous users cannot create tags
SELECT throws_ok(
    $$ SELECT create_tag('anon_tag', (SELECT id FROM send_accounts LIMIT 1)) $$,
    'P0001',
    'User does not own this send_account'
);

-- Test 12: Anonymous users cannot modify any tag data (silently does nothing due to RLS)
UPDATE tags SET name = 'hacked' WHERE id = 1;
SELECT tests.authenticate_as('security_user1');
SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name IN ('user1_pending', 'user1_confirmed')
), 'User1 tags unchanged (anonymous user could not modify them)');

SELECT * FROM finish();
ROLLBACK;
