BEGIN;
SELECT plan(9);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Setup test user and send account
SELECT tests.create_supabase_user('lifecycle_user');
SELECT tests.authenticate_as('lifecycle_user');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('lifecycle_user'), '0x1234567890123456789012345678901234567890', 8453, '\\x00');

-- Test 1: Create tag successfully
SELECT ok(
    (SELECT create_tag('lifecycletag1', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user')))) IS NOT NULL,
    'create_tag returns tag_id'
);

SELECT ok(EXISTS(
    SELECT 1 FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('lifecycle_user') 
    AND sat.tag_id = (SELECT id FROM tags WHERE name = 'lifecycletag1' AND user_id = tests.get_supabase_uid('lifecycle_user'))
), 'Junction table entry created');

SELECT ok(EXISTS(
    SELECT 1 FROM tags 
    WHERE name = 'lifecycletag1' 
    AND user_id = tests.get_supabase_uid('lifecycle_user')
    AND status = 'pending'
), 'Tag created with pending status');

-- Test 2: Tag reuse when available
-- First make the tag available by removing association (this should trigger the proper status update)
DELETE FROM send_account_tags 
WHERE tag_id = (SELECT id FROM tags WHERE name = 'lifecycletag1' AND user_id = tests.get_supabase_uid('lifecycle_user'));

-- Test that the same tag_id is returned when reusing an available tag
SELECT ok(
    (SELECT create_tag('lifecycletag1', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user')))) IS NOT NULL,
    'Available tag reused (tag_id returned)'
);

SELECT ok(EXISTS(
    SELECT 1 FROM tags 
    WHERE name = 'lifecycletag1' 
    AND status = 'pending'
    AND user_id = tests.get_supabase_uid('lifecycle_user')
), 'Available tag reused and set to pending');

SELECT ok(EXISTS(
    SELECT 1 FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('lifecycle_user')
    AND sat.tag_id = (SELECT id FROM tags WHERE name = 'lifecycletag1' AND user_id = tests.get_supabase_uid('lifecycle_user'))
), 'Junction table entry created for reused tag');

-- Test 3: Create multiple tags (test up to limit)
SELECT create_tag('lifecycletag2', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user')));
SELECT create_tag('lifecycletag3', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user')));
SELECT create_tag('lifecycletag4', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user')));
SELECT create_tag('lifecycletag5', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('lifecycle_user')));

SELECT ok((
    SELECT COUNT(*) FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('lifecycle_user')
) = 5, 'User can create up to 5 tags');

-- Test 4: Tag limit enforcement (attempt 6th tag)
SELECT throws_ok(
    'SELECT create_tag(''lifecycletag6'', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid(''lifecycle_user'')))',
    NULL,
    'Tag limit enforced'
);

-- Test 5: Verify user ownership in create_tag
-- Setup other user
SELECT tests.create_supabase_user('lifecycle_other');
SELECT tests.authenticate_as('lifecycle_other');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('lifecycle_other'), '0x2234567890123456789012345678901234567890', 8453, '\\x00');

-- Try to create tag for another user's send account (should fail)
SELECT tests.authenticate_as('lifecycle_user');

SELECT throws_ok(
    'SELECT create_tag(''unauthorized_tag'', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid(''lifecycle_other'')))',
    NULL,
    'Unauthorized tag creation prevented'
);

SELECT finish();
ROLLBACK;
