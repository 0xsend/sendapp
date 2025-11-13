BEGIN;
SELECT plan(15);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

-- Setup test users and send accounts
SELECT tests.create_supabase_user('main_tag_user');
SELECT tests.authenticate_as('main_tag_user');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('main_tag_user'), '0x2234567890123456789012345678901234567890', 8453, '\\x00');

-- Setup another user for testing validation  
SELECT tests.create_supabase_user('main_tag_other');
SELECT tests.authenticate_as('main_tag_other');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('main_tag_other'), '0x3234567890123456789012345678901234567890', 8453, '\\x00');

-- Switch back to main test user for tag creation
SELECT tests.authenticate_as('main_tag_user');

-- Test 1: No main tag initially
SELECT ok((
    SELECT main_tag_id FROM send_accounts 
    WHERE user_id = tests.get_supabase_uid('main_tag_user')
) IS NULL, 'Send account has no main tag initially');

-- Test 2: First confirmed tag becomes main automatically
SELECT create_tag('maintag1', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('main_tag_user')));

-- Use service_role to update tag status directly
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name = 'maintag1';
SET ROLE postgres;

SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('main_tag_user') AND t.name = 'maintag1'
), 'First confirmed tag auto-assigned as main');

-- Test 3: Create and confirm second tag (should not auto-change main)
SELECT create_tag('maintag2', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('main_tag_user')));

SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name = 'maintag2';
SET ROLE postgres;

SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('main_tag_user') AND t.name = 'maintag1'
), 'Main tag remains the same when additional tags are confirmed');

-- Test 4: Manual main tag change to owned confirmed tag
SELECT tests.authenticate_as('main_tag_user');

UPDATE send_accounts 
SET main_tag_id = (SELECT id FROM tags WHERE name = 'maintag2')
WHERE user_id = tests.get_supabase_uid('main_tag_user');

SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('main_tag_user') AND t.name = 'maintag2'
), 'User can manually change main tag to their confirmed tag');

-- Test 5: Cannot set main_tag_id to non-existent tag
SELECT throws_ok(
    $$UPDATE send_accounts SET main_tag_id = 99999 WHERE user_id = (SELECT tests.get_supabase_uid('main_tag_user'))$$,
    NULL,
    'Invalid main tag rejected'
);

-- Test 6: Cannot set main_tag_id to unowned tag
SELECT tests.authenticate_as('main_tag_other');
SELECT create_tag('othertag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('main_tag_other')));

SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name = 'othertag';
SET ROLE postgres;

SELECT tests.authenticate_as('main_tag_user');

SELECT throws_ok(
    $$UPDATE send_accounts SET main_tag_id = (SELECT id FROM tags WHERE name = 'othertag') WHERE user_id = (SELECT tests.get_supabase_uid('main_tag_user'))$$,
    NULL,
    'Unowned main tag rejected'
);

-- Test 7: Cannot set main_tag_id to pending tag
SELECT create_tag('maintag3', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('main_tag_user')));

SELECT throws_ok(
    $$UPDATE send_accounts SET main_tag_id = (SELECT id FROM tags WHERE name = 'maintag3') WHERE user_id = (SELECT tests.get_supabase_uid('main_tag_user'))$$,
    NULL,
    'Pending main tag rejected'
);

-- Test 8: Main tag succession on deletion - delete current main
SET ROLE service_role;
DELETE FROM send_account_tags 
WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('main_tag_user'))
AND tag_id = (SELECT id FROM tags WHERE name = 'maintag2');
SET ROLE postgres;

SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('main_tag_user') AND t.name = 'maintag1'
), 'Next oldest tag promoted to main on deletion of main tag');

-- Test 9: Main tag succession with multiple deletions
-- Confirm the third tag
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name = 'maintag3';
SET ROLE postgres;

-- Delete current main (maintag1), should promote to maintag3
SET ROLE service_role;
DELETE FROM send_account_tags 
WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('main_tag_user'))
AND tag_id = (SELECT id FROM tags WHERE name = 'maintag1');
SET ROLE postgres;

SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('main_tag_user') AND t.name = 'maintag3'
), 'Correct tag promoted to main with multiple confirmed tags');

-- Test 10: NULL allowed for new accounts without confirmed tags
SELECT tests.create_supabase_user('main_tag_new');

SET ROLE service_role;
INSERT INTO send_accounts(user_id, address, chain_id, init_code, main_tag_id)
VALUES (tests.get_supabase_uid('main_tag_new'), '0x9999999999999999999999999999999999999999', 8453, '\\x00', NULL);
SET ROLE postgres;

SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts 
    WHERE user_id = tests.get_supabase_uid('main_tag_new') AND main_tag_id IS NULL
), 'NULL main_tag_id allowed for new accounts');

-- Test 11: Cannot delete last confirmed tag (constraint prevents it)
SELECT tests.authenticate_as('main_tag_user');
SELECT throws_ok(
    $$ DELETE FROM send_account_tags
       WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('main_tag_user'))
       AND tag_id = (SELECT id FROM tags WHERE name = 'maintag3') $$,
    'P0001',
    'Cannot delete your last paid sendtag. Users must maintain at least one paid sendtag.'
);
SET ROLE postgres;

-- Test 12: Verify main tag remains unchanged after failed deletion attempt
SELECT ok(EXISTS(
    SELECT 1 FROM send_accounts sa
    JOIN tags t ON t.id = sa.main_tag_id
    WHERE sa.user_id = tests.get_supabase_uid('main_tag_user') AND t.name = 'maintag3'
), 'Main tag remains unchanged after constraint prevents deletion');

-- Test 13: Test main_tag_id column exists
SELECT has_column('public', 'send_accounts', 'main_tag_id', 'send_accounts has main_tag_id column');

-- Test 14: Test main_tag_id column type
SELECT col_type_is('public', 'send_accounts', 'main_tag_id', 'bigint', 'main_tag_id is bigint');

-- Test 15: Test that main_tag_id can be null
SELECT col_is_null('public', 'send_accounts', 'main_tag_id', 'main_tag_id can be null');

SELECT finish();
ROLLBACK;