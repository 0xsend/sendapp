BEGIN;
SELECT
    plan(8);
CREATE EXTENSION "basejump-supabase_test_helpers";
-- Creating a test user
SELECT
    tests.create_supabase_user('tag_creator');
SELECT
    tests.authenticate_as('tag_creator');
-- Create send account first
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('tag_creator'), '0xbbbb000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Create a pending tag using create_tag function
SELECT
    create_tag('test_tag',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_creator')));
SELECT
    results_eq('SELECT status FROM tags WHERE name = ''test_tag''', $$
    VALUES ('pending'::public.tag_status) $$, 'User should be able to create a tag with pending status');
-- Select is case insensitive
SELECT
    results_eq($$
        SELECT
            status FROM tags
            WHERE
                name = 'TEST_TAG' $$, $$
            VALUES ('pending'::public.tag_status) $$, 'Tag lookup should be case insensitive');
-- Users can delete their own pending tags
DELETE FROM tags
WHERE name = 'test_tag';
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM tags
            WHERE
                name = 'test_tag' $$, $$
            VALUES (0) $$, 'Users can delete their own pending tags');
-- User can create up to 5 tags
SELECT
    create_tag('test_tag_1',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_creator')));
SELECT
    create_tag('test_tag_2',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_creator')));
SELECT
    create_tag('test_tag_3',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_creator')));
SELECT
    create_tag('test_tag_4',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_creator')));
SELECT
    create_tag('test_tag_5',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_creator')));
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM tags t
            JOIN send_account_tags sat ON sat.tag_id = t.id
            JOIN send_accounts sa ON sa.id = sat.send_account_id
            WHERE
                sa.user_id = tests.get_supabase_uid('tag_creator') $$, $$
            VALUES (5) $$, 'User should be able to create up to 5 tags');
-- User cannot create more than 5 tags
SELECT
    throws_ok($$
        SELECT
            create_tag('test_tag_6',(
                    SELECT
                        id
                    FROM send_accounts
                    WHERE
                        user_id = tests.get_supabase_uid('tag_creator'))) $$, 'User can have at most 5 tags', 'Users cannot create more than 5 tags');
-- Delete old tags as user
DELETE FROM tags
WHERE name = 'test_tag_1';
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM tags
            WHERE
                name = 'test_tag_1' $$, $$
            VALUES (0) $$, 'User can delete their pending tags');
-- verify send_account_tags is deleted
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM send_account_tags
            WHERE
                tag_id =(
                    SELECT
                        id
                    FROM tags
                    WHERE
                        name = 'test_tag_1') $$, $$
            VALUES (0) $$, 'send_account_tags should be deleted when tag is deleted');
SELECT
    create_tag('old_tag',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_creator')));
SELECT
    tests.authenticate_as('tag_creator');
UPDATE
    tags
SET
    created_at = now() - interval '32 minutes'
WHERE
    name = 'old_tag';
SELECT
    *
FROM
    tags;
SELECT
    tests.create_supabase_user('tag_taker');
SELECT
    tests.authenticate_as('tag_taker');
-- Create send account for tag_taker
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('tag_taker'), '0xcccc000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');
SELECT
    create_tag('old_tag',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_taker')));
SELECT
    results_eq($$
        SELECT
            status FROM tags
            WHERE
                name = 'old_tag' $$, $$
            VALUES ('available'::public.tag_status) $$, 'Pending tag more than 30 minutes old is seen as available and claimable by any user');
SELECT
    finish();
ROLLBACK;

