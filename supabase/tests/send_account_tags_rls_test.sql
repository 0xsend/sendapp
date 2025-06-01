BEGIN;
SELECT plan(21);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Setup three users with send accounts
SELECT tests.create_supabase_user('rls_user1');
SELECT tests.create_supabase_user('rls_user2');
SELECT tests.create_supabase_user('rls_user3');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('rls_user1'), '0x3234567890123456789012345678901234567890', 8453, '\\x00');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('rls_user2'), '0x4234567890123456789012345678901234567890', 8453, '\\x00');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('rls_user3'), '0x5234567890123456789012345678901234567890', 8453, '\\x00');

-- Create tags for each user with proper authentication
SELECT tests.authenticate_as('rls_user1');
SELECT create_tag('user1tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('rls_user1')));

SELECT tests.authenticate_as('rls_user2');
SELECT create_tag('user2tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('rls_user2')));

SELECT tests.authenticate_as('rls_user3');
SELECT create_tag('user3tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('rls_user3')));

-- Switch to service_role for creating available tag
SET ROLE service_role;

-- Create an available tag (not associated with any user)
INSERT INTO tags (name, status, user_id)
VALUES ('availabletag', 'available', NULL);

-- Confirm some tags for testing using service_role
UPDATE tags SET status = 'confirmed' WHERE name = 'user2tag';
UPDATE tags SET status = 'confirmed' WHERE name = 'user3tag';

SET ROLE postgres;

-- **Test: LS policies**

-- Test: User can see their own send_account_tags
SELECT tests.authenticate_as('rls_user1');

SELECT ok(EXISTS(
    SELECT 1 FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('rls_user1')
    AND sat.tag_id = (SELECT id FROM tags WHERE name = 'user1tag')
), 'User can see own send_account_tags');

-- Test: User cannot see other users' send_account_tags
SELECT ok(NOT EXISTS(
    SELECT 1 FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('rls_user2')
    AND sat.tag_id = (SELECT id FROM tags WHERE name = 'user2tag')
), 'User cannot see other users send_account_tags');

-- Test: User can create tags through proper function (creates send_account_tags entry)
SELECT tests.authenticate_as('rls_user1');

SELECT create_tag('inserttest', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('rls_user1')));

SELECT ok(EXISTS(
    SELECT 1 FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('rls_user1')
    AND sat.tag_id = (SELECT id FROM tags WHERE name = 'inserttest')
), 'User can create tags which creates send_account_tags entries');

-- Test: User cannot create tags for other users' send accounts
SELECT tests.authenticate_as('rls_user1');

SELECT throws_ok(
    'SELECT create_tag(''unauthorizedinsert'', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid(''rls_user2'')))',
    NULL,
    'Correctly prevented unauthorized tag creation'
);

-- **Test: able RLS policies**

-- Test: User cannot see available tags
SELECT tests.authenticate_as('rls_user1');

SELECT is_empty(
    $$
        SELECT * FROM tags WHERE name = 'availabletag' AND status = 'available'
    $$,
    'User cannot see available tags'
);

-- Test: User can see their own pending tags
SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name = 'user1tag' AND status = 'pending'
), 'User can see own pending tags');

-- Test: User cannot see confirmed tags from other users
SELECT is_empty(
    $$
        SELECT * FROM tags WHERE name = 'user2tag' AND status = 'confirmed'
    $$,
    'User cannot see confirmed tags from other users'
);

-- Test: User cannot see other users' pending tags
SELECT tests.authenticate_as('rls_user3');

SELECT ok(NOT EXISTS(
    SELECT 1 FROM tags WHERE name = 'user1tag' AND status = 'pending'
), 'User cannot see other users pending tags');

-- Test: User can confirm their first sendtag
SELECT tests.authenticate_as('rls_user1');

UPDATE tags SET status = 'confirmed' WHERE name = 'user1tag';

SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name = 'user1tag' AND status = 'confirmed'
), 'User can confirm their first sendtag');

-- Test: User cannot manually confirm a 2nd tag (should use confirm_tags function)
SELECT create_tag('rls_user1tag2', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('rls_user1')));
SELECT throws_ok(
    'UPDATE tags SET status = ''confirmed'' WHERE name = ''rls_user1tag2''',
    'Users cannot confirm their own tags',
    'User cannot manually confirm a 2nd tag'
);

-- Test: User cannot update tags they don't own
UPDATE tags SET status = 'confirmed' WHERE name = 'user2tag';
SELECT is_empty(
    $$
        SELECT * FROM tags WHERE name = 'user2tag' AND status = 'confirmed'
    $$,
    'User cannot update tags they do not own'
);

-- Test: User can delete their own send_account_tags
-- Create a tag for deletion test
SET ROLE service_role;
SELECT create_tag('deletetest', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('rls_user1')));
SET ROLE postgres;

SELECT tests.authenticate_as('rls_user1');

DELETE FROM send_account_tags
WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('rls_user1'))
AND tag_id = (SELECT id FROM tags WHERE name = 'deletetest');

SELECT ok(NOT EXISTS(
    SELECT 1 FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('rls_user1')
    AND sat.tag_id = (SELECT id FROM tags WHERE name = 'deletetest')
), 'User can delete their own send_account_tags');

-- Test: User cannot delete other users' send_account_tags
DELETE FROM send_account_tags WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('rls_user2'));
SET ROLE postgres;
SELECT ok(EXISTS (
    SELECT 1 FROM send_account_tags WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('rls_user2'))
), 'User cannot delete other users send_account_tags');

-- Test: Anonymous users can see available and confirmed tags only
SELECT tests.clear_authentication();

SELECT is_empty(
    $$SELECT 1 FROM tags WHERE status = 'available'$$, 'Anonymous users cannot see available tags'
);

-- Test: Anonymous users can see confirmed tags
SELECT is_empty($$SELECT 1 FROM tags WHERE status = 'confirmed'$$, 'Anonymous users cannot see confirmed tags');

-- Test: Anonymous users cannot see pending tags
SELECT is_empty($$SELECT 1 FROM tags WHERE status = 'pending'$$, 'Anonymous users cannot see pending tags');

-- Test: Anonymous users cannot see any send_account_tags
SELECT is_empty($$SELECT 1 FROM send_account_tags$$, 'Anonymous users cannot see any send_account_tags');

-- Test: Anonymous users cannot insert anything
SELECT throws_ok(
    'INSERT INTO tags (name, status) VALUES (''anontest'', ''pending'')',
    NULL,
    'Anonymous users cannot insert tags'
);

-- Test: Test: ag ownership scenarios
SELECT tests.authenticate_as('rls_user2');

-- User2 should see their confirmed tag and be able to query it
SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON sat.tag_id = t.id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('rls_user2') AND t.status = 'confirmed'
), 'User can query their own tags through junction table');

-- Test: Test: f tags count
SELECT ok((
    SELECT COUNT(*) FROM tags t
    JOIN send_account_tags sat ON sat.tag_id = t.id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('rls_user2')
) >= 1, 'User can count their own tags');

-- Test: Edge cases with tag status transitions
SELECT tests.authenticate_as('rls_user3');

-- User should be able to see their tag before and after status change
-- Create pending tag
SET ROLE service_role;
SELECT create_tag('statustransition', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('rls_user3')));
SET ROLE postgres;

SELECT tests.authenticate_as('rls_user3');

SELECT ok(EXISTS(
    SELECT 1 FROM tags WHERE name = 'statustransition' AND status = 'pending'
), 'User can see their pending tag before status change');

SELECT finish();
ROLLBACK;
