-- 2. Tag Creation
BEGIN;
SELECT
    plan(35);
CREATE EXTENSION "basejump-supabase_test_helpers";
-- Creating a test user
SELECT
    tests.create_supabase_user('tag_creator');
SELECT
    tests.authenticate_as('tag_creator');
-- Create a send account for the test user
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('tag_creator'), '0xcccc000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Inserting a tag for test user and fetching it
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
    results_eq('SELECT status FROM tags WHERE name = ''TEST_TAG''', $$
    VALUES ('pending'::public.tag_status) $$, 'User should be able to create a tag with pending status');
-- tags cannot be longer than 20 characters
SELECT
    throws_ok('INSERT INTO tags(name, status) VALUES (''this_tag_name_is_longer_than_20_characters'', ''pending'')', '23514', 'new row for relation "tags" violates check constraint "tags_name_check"');
-- tags cannot be empty
SELECT
    throws_ok('INSERT INTO tags(name, status) VALUES ('''', ''pending'')', '23514', 'new row for relation "tags" violates check constraint "tags_name_check"');
-- tags must be English alphanumeric
SELECT
    throws_ok(format($$
            SELECT
                create_tag('tag_name_123_%s',(
                        SELECT
                            id
                        FROM send_accounts
                        WHERE
                            user_id = tests.get_supabase_uid('tag_creator'))) $$, invalid_char), 'P0001', 'new row for relation "tags" violates check constraint "tags_name_check"')
FROM
    unnest(ARRAY['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '{', '}', '[', ']', '|', '\', ' : ', ';
', ' " ', ' \\', ' < ', ' > ', ',
', '.', ' ? ', ' / ', ' ` ', ' ~ ']) AS f(invalid_char);
SELECT
    finish();
ROLLBACK;

