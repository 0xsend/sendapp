-- 2. Tag Creation
BEGIN;

SELECT plan(7);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator');

-- Create send account for the user
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('tag_creator'),
    '0x1234567890123456789012345678901234567890',
    8453,
    '\\x00'
);

SELECT tests.authenticate_as('tag_creator');

-- Creating a tag using create_tag function
SELECT create_tag('test_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator')));

SELECT results_eq(
    'SELECT status FROM tags WHERE name = ''test_tag''',
    $$VALUES ('pending'::public.tag_status) $$,
    'User should be able to create a tag with pending status'
);

-- Select is case insensitive
SELECT results_eq(
    'SELECT status FROM tags WHERE name = ''TEST_TAG''',
    $$VALUES ('pending'::public.tag_status) $$,
    'Tag names are case insensitive'
);

-- Users can delete their own tags through send_account_tags
DELETE FROM send_account_tags 
WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator'))
  AND tag_id = (SELECT id FROM tags WHERE name = 'test_tag');

SELECT results_eq(
    $$SELECT COUNT(*)::integer
    FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('tag_creator')
      AND sat.tag_id = (SELECT id FROM tags WHERE name = 'test_tag') $$,
    $$VALUES (0) $$,
    'Users can delete their own tag associations'
);

-- User can create up to 5 tags per send account
DO $$
DECLARE 
    send_account_id uuid;
BEGIN
    SELECT id INTO send_account_id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator');
    
    PERFORM create_tag('test_tag_1', send_account_id);
    PERFORM create_tag('test_tag_2', send_account_id);
    PERFORM create_tag('test_tag_3', send_account_id);
    PERFORM create_tag('test_tag_4', send_account_id);
    PERFORM create_tag('test_tag_5', send_account_id);
END $$;

SELECT results_eq(
    $$SELECT COUNT(*)::integer 
    FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('tag_creator') $$,
    $$VALUES (5) $$,
    'User should be able to create up to 5 tags per send account'
);

-- User cannot create more than 5 tags per send account
SELECT throws_ok(
    $$SELECT create_tag('test_tag_6', (
        SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator')
    )) $$,
    'User can have at most 5 tags',
    'Users cannot create more than 5 tags per send account'
);

-- Clean up for next test
DELETE FROM send_account_tags 
WHERE send_account_id = (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator'));

-- Test that available tags can be reused
DO $$
DECLARE 
    send_account_id uuid;
    reused_tag_id bigint;
BEGIN
    SELECT id INTO send_account_id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator');
    
    -- Create tag
    SELECT create_tag('reusable_tag', send_account_id) INTO reused_tag_id;
    
    -- Delete association (makes tag available)
    DELETE FROM send_account_tags sat
    WHERE sat.send_account_id = send_account_id AND sat.tag_id = reused_tag_id;
    
    -- Create tag with same name (should reuse)
    PERFORM create_tag('reusable_tag', send_account_id);
END $$;

SELECT results_eq(
    $$SELECT COUNT(*)::integer 
    FROM tags 
    WHERE name = 'reusable_tag' $$,
    $$VALUES (1) $$,
    'Available tags are reused when creating tags with same name'
);

-- Test tag creation with different send accounts for same user
DO $$
DECLARE 
    second_send_account_id uuid;
BEGIN
    -- Create another send account for same user
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (
        tests.get_supabase_uid('tag_creator'),
        '0x2234567890123456789012345678901234567890',
        8453,
        '\\x00'
    ) RETURNING id INTO second_send_account_id;
    
    -- User can create tags for their different send accounts
    PERFORM create_tag('multi_account_tag', second_send_account_id);
END $$;

SELECT results_eq(
    $$SELECT COUNT(*)::integer 
    FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = tests.get_supabase_uid('tag_creator') $$,
    $$VALUES (2) $$,
    'User can create tags for multiple send accounts they own'
);

SELECT finish();

ROLLBACK;