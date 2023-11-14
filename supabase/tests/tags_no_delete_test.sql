-- 5. Tag Deletion
BEGIN;

SELECT plan(1);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator');

SELECT tests.authenticate_as('tag_creator');

-- Inserting a tag for test user
INSERT INTO tags(name)
VALUES('test_tag');

-- confirm tag
set role service_role;

select confirm_tags(
        '{test_tag}',
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        null
    );

-- Deleting the tag
set role postgres;

SELECT tests.authenticate_as('tag_creator');

-- Trying to delete the tag is a NOOP
DELETE FROM tags
WHERE name = 'test_tag';

SELECT results_eq(
        'SELECT COUNT(*)::integer FROM tags WHERE name = ''test_tag''',
        $$VALUES (1) $$,
        'User should not be able to delete a tag'
    );

SELECT *
FROM finish();

ROLLBACK;
