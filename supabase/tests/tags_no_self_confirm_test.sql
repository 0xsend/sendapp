-- 4. Tag Self-Confirmation
BEGIN;
SELECT
    plan(3);
CREATE EXTENSION "basejump-supabase_test_helpers";
-- Creating a test user
SELECT
    tests.create_supabase_user('tag_creator');
SELECT
    tests.authenticate_as('tag_creator');
-- Create send_account for the user
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('tag_creator'), '0xbbbb000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Create test tag using the new function
SELECT
    create_tag('test_tag',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_creator')));
-- Test 1: Trying to confirm via confirm_tags function
SELECT
    throws_ok($$
        SELECT
            confirm_tags(ARRAY['test_tag']::citext[],(
                    SELECT
                        id
                    FROM send_accounts
                    WHERE
                        user_id = tests.get_supabase_uid('tag_creator')), 'some_event_id', NULL) $$, 'permission denied for function confirm_tags', 'User should not be able to confirm their own tag');
-- Test 2: Direct INSERT of confirmed tag
SELECT
    throws_ok($$
        SELECT
            create_tag('test_tagz',(
                    SELECT
                        id
                    FROM send_accounts
                    WHERE
                        user_id = tests.get_supabase_uid('tag_creator')));
UPDATE
    tags
SET
    status = 'confirmed'
WHERE
    name = 'test_tagz';
$$,
'Users cannot confirm their own tags',
'User should not be able to confirm their own tag');
-- Test 3: Direct UPDATE to confirmed
SELECT
    throws_ok($$ UPDATE
            tags
        SET
            status = 'confirmed'::public.tag_status
            WHERE
                name = 'test_tag' $$, 'Users cannot confirm their own tags', 'User should not be able to confirm their own tag');
SELECT
    finish();
ROLLBACK;

