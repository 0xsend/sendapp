-- 2. Tag Creation
BEGIN;

SELECT plan(7);

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

-- Users can delete their own pending tags
DELETE FROM tags
WHERE name = 'test_tag';

SELECT results_eq(
    $$SELECT COUNT(*)::integer
    FROM tags
    WHERE name = 'test_tag' $$,
      $$VALUES (0) $$,
      'Users can delete their own pending tags'
  );

-- User can create up to 5 tags
INSERT INTO tags(name, user_id)
VALUES(
    'test_tag_1',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'test_tag_2',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'test_tag_3',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'test_tag_4',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'test_tag_5',
    tests.get_supabase_uid('tag_creator')
  );

SELECT results_eq(
    'SELECT COUNT(*)::integer FROM tags WHERE user_id = tests.get_supabase_uid(''tag_creator'')',
    $$VALUES (5) $$,
    'User should be able to create up to 5 tags'
  );

-- User cannot create more than 5 tags
SELECT throws_ok(
    $$INSERT INTO tags(name, user_id)
    VALUES (
        'test_tag_6',
        tests.get_supabase_uid('tag_creator')
      ) $$,
      'User can have at most 5 tags',
      'Users cannot create more than 5 tags'
  );

DELETE FROM tags;

SELECT throws_ok(
    $$
    INSERT INTO tags(name, user_id)
    VALUES(
        'test_tag_1',
        tests.get_supabase_uid('tag_creator')
      ),
      (
        'test_tag_2',
        tests.get_supabase_uid('tag_creator')
      ),
      (
        'test_tag_3',
        tests.get_supabase_uid('tag_creator')
      ),
      (
        'test_tag_4',
        tests.get_supabase_uid('tag_creator')
      ),
      (
        'test_tag_5',
        tests.get_supabase_uid('tag_creator')
      ),
      (
        'test_tag_6',
        tests.get_supabase_uid('tag_creator')
      );

$$,
'User can have at most 5 tags',
'Users cannot create more than 5 tags'
);

-- Pending tag more than 30 minutes old is claimable by any user
INSERT INTO tags(name, user_id, status, created_at)
VALUES(
    'test_tag',
    tests.get_supabase_uid('tag_creator'),
    'pending'::public.tag_status,
    NOW() - INTERVAL '31 minutes'
  );

SELECT tests.create_supabase_user('tag_taker');

SELECT tests.authenticate_as('tag_taker');

INSERT INTO tags(name, user_id, status)
VALUES(
    'test_tag',
    tests.get_supabase_uid('tag_taker'),
    'pending'::public.tag_status
  );

SELECT results_eq(
    'SELECT status FROM tags WHERE name = ''test_tag''',
    $$VALUES ('pending'::public.tag_status) $$,
    'Pending tag more than 30 minutes old is claimable by any user'
  );

SELECT FINISH();

ROLLBACK;
