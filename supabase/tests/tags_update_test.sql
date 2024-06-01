-- 5. Tag Deletion
BEGIN;

SELECT plan(3);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator');

SELECT tests.authenticate_as('tag_creator');

-- Inserting a tag for test user
INSERT INTO tags(name)
VALUES('test_tag');

-- User can change the name of a pending tag
UPDATE tags
SET name = 'test_tag2'
WHERE name = 'test_tag';

SELECT results_eq(
    $$SELECT COUNT(*)::integer
    FROM tags
    WHERE name = 'test_tag2' $$,
      $$VALUES (1) $$,
      'User should be able to change the name of a pending tag'
  );

set role service_role;

-- confirm tag
select confirm_tags(
    '{test_tag2}',
    '0x1234567890123456789012345678901234567890123456789012345678901234',
    null
  );

-- Users cannot update a confirmed tag
set role postgres;

SELECT tests.authenticate_as('tag_creator');

SELECT throws_ok(
    $$UPDATE tags
    set name = 'test_tag3'
    where name = 'test_tag2';

$$,
'Users cannot change the name of a confirmed tag',
'Users cannot change the name of a confirmed tag'
);

-- not even service role can update a confirmed tag
set role service_role;

SELECT throws_ok(
    $$UPDATE tags
    set name = 'test_tag3'
    where name = 'test_tag2';

$$,
'update or delete on table "tags" violates foreign key constraint "tag_receipts_tag_name_fkey" on table "tag_receipts"',
'Service role should be able to change the name of a confirmed tag'
);

SELECT finish();

ROLLBACK;
