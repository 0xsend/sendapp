BEGIN;
SELECT plan(3);

-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers";  -- noqa: RF05

-- Create test users and authenticate as the users
SELECT tests.create_supabase_user('test_user_from');
SELECT tests.create_supabase_user('test_user_to');


INSERT INTO tags (user_id, name, status)
VALUES (tests.get_supabase_uid('test_user_from'), 'tag1', 'confirmed'),
(tests.get_supabase_uid('test_user_from'), 'tag2', 'confirmed'),
(tests.get_supabase_uid('test_user_to'), 'tag3', 'confirmed');

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
