BEGIN;
SELECT plan(3);

-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers";  -- noqa: RF05

-- Create test users and authenticate as the users
SELECT tests.create_supabase_user('test_user_from');
SELECT tests.create_supabase_user('test_user_to');


-- Create send accounts for test users as authenticated users
SELECT tests.authenticate_as('test_user_from');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('test_user_from'), '0x1234567890123456789012345678901234567890', 8453, '\\x00');

SELECT tests.authenticate_as('test_user_to');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('test_user_to'), '0x2234567890123456789012345678901234567890', 8453, '\\x00');

-- Create tags as the proper authenticated users
SELECT tests.authenticate_as('test_user_from');
SELECT create_tag('tag1', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('test_user_from')));
SELECT create_tag('tag2', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('test_user_from')));

SELECT tests.authenticate_as('test_user_to');
SELECT create_tag('tag3', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('test_user_to')));

-- Confirm the tags as service_role
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name IN ('tag1', 'tag2', 'tag3');
SET ROLE postgres;

INSERT INTO activity (
    event_id, created_at, event_name, from_user_id, to_user_id, data
)
VALUES (
    'test',
    now(),
    'test_event',
    tests.get_supabase_uid('test_user_from'),
    tests.get_supabase_uid('test_user_to'),
    '{"key": "value"}'
);

-- Test if the activity_feed view returns the correct 
-- data for the authenticated user
SELECT tests.authenticate_as('test_user_from');
SELECT results_eq(
    $$
        SELECT event_name, (from_user).id, (to_user).tags, data
        FROM activity_feed
    $$,
    $$
        VALUES ('test_event',
                tests.get_supabase_uid('test_user_from'),
                '{tag3}'::text[],
                '{"key": "value"}'::jsonb)
    $$,
    'Test if the activity_feed view returns the correct data for the authenticated user'
);

-- Test if the activity_feed view returns the correct data for the other user
SELECT tests.authenticate_as('test_user_to');
SELECT results_eq(
    $$
        SELECT event_name, (from_user).tags, (to_user).id, data
        FROM activity_feed
    $$,
    $$
        VALUES ('test_event',
                '{tag1,tag2}'::text[],
                tests.get_supabase_uid('test_user_to'),
                '{"key": "value"}'::jsonb)
    $$,
    'Test if the activity_feed view returns the correct data for the other user'
);

-- Test if the activity_feed view returns no data for an unauthenticated user
SELECT tests.clear_authentication();
SELECT is_empty(
    $$
        SELECT * FROM activity_feed
    $$,
    'Test if the activity_feed view returns no data for an unauthenticated user'
);

SELECT finish();
ROLLBACK;
