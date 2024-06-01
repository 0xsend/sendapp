-- 2. Tag Creation
BEGIN;

SELECT plan(35);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator');

SELECT tests.authenticate_as('tag_creator');

-- Inserting a tag for test user and fetching it
INSERT INTO tags(name, user_id)
VALUES(
    'test_tag',
    tests.get_supabase_uid('tag_creator')
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
    'INSERT INTO tags(name, user_id) VALUES (''this_tag_name_is_longer_than_20_characters'', tests.get_supabase_uid(''tag_creator''))',
    '23514',
    'new row for relation "tags" violates check constraint "tags_name_check"'
  );

-- tags cannot be empty
SELECT throws_ok(
    'INSERT INTO tags(name, user_id) VALUES ('''', tests.get_supabase_uid(''tag_creator''))',
    '23514',
    'new row for relation "tags" violates check constraint "tags_name_check"'
  );

-- tags must be English alphanumeric
SELECT throws_ok(
    'INSERT INTO tags(name, user_id) VALUES (''tag_name_123_' || invalid_char || ''', tests.get_supabase_uid(''tag_creator''))',
    '23514',
    'new row for relation "tags" violates check constraint "tags_name_check"'
  )
FROM UNNEST(
    ARRAY ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=', '{', '}', '[', ']', '|', '\', ':', ';', '"', '\\', '<', '>', ',', '.', '?', '/', '`', '~']) F(invalid_char);

SELECT FINISH();

ROLLBACK;
