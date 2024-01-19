-- Tag Search
BEGIN;

SELECT plan(2);

CREATE EXTENSION "basejump-supabase_test_helpers";

TRUNCATE tags CASCADE;

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator');

SELECT tests.authenticate_as('tag_creator');

-- Inserting a tag for test user
INSERT INTO tags(name, user_id)
VALUES (
    'zzz1',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'zzz2',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'tag_creator_zzz',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'tag_creator_zzz2',
    tests.get_supabase_uid('tag_creator')
  );

select tests.authenticate_as_service_role();

select confirm_tags(
    '{zzz1,zzz2,tag_creator_zzz,tag_creator_zzz2}',
    '0x3234567890123456789012345678901234567890123456789012345678901234',
    null
  );

select tests.clear_authentication();

-- Verify that the tags are not visible to anon
SELECT throws_ok(
    $$
    SELECT count(*)::integer
    FROM tag_search('zzz') $$,
      'permission denied for function tag_search'
  );

SELECT tests.create_supabase_user('tag_searcher');

SELECT tests.authenticate_as('tag_searcher');

-- Verify that the tags are visible to the public
SELECT results_eq(
    $$
    SELECT count(*)::integer
    FROM tag_search('zzz') $$,
      $$VALUES (4) $$,
      'Tags should be visible to the public'
  );

SELECT *
FROM finish();

ROLLBACK;
