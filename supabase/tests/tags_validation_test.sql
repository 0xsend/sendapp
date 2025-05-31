-- 2. Tag Creation
BEGIN;

SELECT plan(35);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator');

SELECT tests.authenticate_as('tag_creator');

-- Create a send_account for the test user
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('tag_creator'),
    '0x1234567890ABCDEF1234567890ABCDEF12345678',
    8453,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- Use the create_tag function to properly create tag with association
SELECT create_tag(
    'test_tag'::citext,
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator'))
);

SELECT results_eq(
    'SELECT status FROM tags WHERE name = ''test_tag''',
    $$VALUES ('pending'::public.tag_status) $$,
    'User should be able to create a tag with pending status'
);

-- Select is case insensitive
SELECT results_eq(
    'SELECT status FROM tags WHERE name = ''TEST_TAG''',
    $$VALUES ('pending'::public.tag_status) $$,
    'User should be able to create a tag with pending status'
);

-- tags cannot be longer than 20 characters
SELECT throws_ok(
    'SELECT create_tag(''this_tag_name_is_longer_than_20_characters''::citext, (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid(''tag_creator'')))',
    '23514',
    'new row for relation "tags" violates check constraint "tags_name_check"'
);

-- tags cannot be empty
SELECT throws_ok(
    'SELECT create_tag(''''::citext, (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid(''tag_creator'')))',
    '23514',
    'new row for relation "tags" violates check constraint "tags_name_check"'
);

-- tags must be English alphanumeric
SELECT
    throws_ok(
        'SELECT create_tag((''tag_name_123_'
        || invalid_char
        || ''')::citext, (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid(''tag_creator'')))',
        '23514',
        'new row for relation "tags" violates check constraint "tags_name_check"'
    )
FROM unnest(
    ARRAY[
        '!',
        '@',
        '#',
        '$',
        '%',
        '^',
        '&',
        '*',
        '(',
        ')',
        '-',
        '+',
        '=',
        '{',
        '}',
        '[',
        ']',
        '|',
        '\',
        ':',
        ';',
        '"',
        '\\',
        '<',
        '>',
        ',',
        '.',
        '?',
        '/',
        '`',
        '~'
    ]
) AS f (invalid_char);

SELECT finish();

ROLLBACK;
