-- 4. Tag Self-Confirmation
BEGIN;

SELECT plan(3);

CREATE EXTENSION "basejump-supabase_test_helpers"; -- noqa: RF05

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator');

SELECT tests.authenticate_as('tag_creator');

-- Inserting a tag for test user
INSERT INTO tags (name, user_id)
VALUES (
    'test_tag',
    tests.get_supabase_uid('tag_creator')
);

-- Trying to confirm the tag as the tag owner (should raise an exception)
SELECT throws_ok(
    $$
    SELECT confirm_tags(
        '{test_tag}',
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        null
      ) $$,
    'permission denied for function confirm_tags',
    'User should not be able to confirm their own tag'
);

-- Bypassing rpc call to confirm tag
SELECT throws_ok(
    $$
    INSERT INTO tags(name, user_id, status)
    VALUES(
        'test_tagz',
        tests.get_supabase_uid('tag_creator'),
        'confirmed'::public.tag_status
      );

$$,
    'Users cannot confirm their own tags',
    'User should not be able to confirm their own tag'
);

SELECT throws_ok(
    $$
    UPDATE tags
    SET status = 'confirmed'::public.tag_status
    WHERE name = 'test_tag' $$,
    'Users cannot confirm their own tags',
    'User should not be able to confirm their own tag'
);

SELECT finish();

ROLLBACK;
