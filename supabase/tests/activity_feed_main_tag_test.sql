BEGIN;
SELECT plan(4);

-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers";  -- noqa: RF05

-- Create test users
SELECT tests.create_supabase_user('test_user_1');
SELECT tests.create_supabase_user('test_user_2');

-- Create send accounts for test users
SELECT tests.authenticate_as('test_user_1');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('test_user_1'), '0x1234567890123456789012345678901234567890', 8453, '\\x00');

SELECT tests.authenticate_as('test_user_2');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('test_user_2'), '0x2234567890123456789012345678901234567890', 8453, '\\x00');

-- Create multiple tags for each user
SELECT tests.authenticate_as('test_user_1');
SELECT create_tag('alpha', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('test_user_1')));
SELECT create_tag('beta', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('test_user_1')));
SELECT create_tag('gamma', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('test_user_1')));

SELECT tests.authenticate_as('test_user_2');
SELECT create_tag('delta', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('test_user_2')));
SELECT create_tag('epsilon', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('test_user_2')));
SELECT create_tag('zeta', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('test_user_2')));

-- Confirm all tags as service_role
SET ROLE service_role;
UPDATE tags SET status = 'confirmed' WHERE name IN ('alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta');

-- Now manually set main tags to NOT be the first one
-- For user 1, set 'beta' as main tag (not 'alpha')
UPDATE send_accounts 
SET main_tag_id = (SELECT id FROM tags WHERE name = 'beta')
WHERE user_id = tests.get_supabase_uid('test_user_1');

-- For user 2, set 'zeta' as main tag (not 'delta')
UPDATE send_accounts 
SET main_tag_id = (SELECT id FROM tags WHERE name = 'zeta')
WHERE user_id = tests.get_supabase_uid('test_user_2');

SET ROLE postgres;

-- Create activity between users
INSERT INTO activity (
    event_id, created_at, event_name, from_user_id, to_user_id, data
)
VALUES (
    'test_main_tag',
    now(),
    'test_event',
    tests.get_supabase_uid('test_user_1'),
    tests.get_supabase_uid('test_user_2'),
    '{"amount": "100"}'
);

-- Test 1: Check that user 1 sees only their own main tag (privacy protection)
SELECT tests.authenticate_as('test_user_1');
SELECT results_eq(
    $$
        SELECT 
            (from_user).main_tag_name,
            (to_user).main_tag_name,
            (from_user).main_tag_id IS NOT NULL as from_has_id,
            (to_user).main_tag_id IS NULL as to_id_is_null
        FROM activity_feed
        WHERE event_name = 'test_event'
    $$,
    $$
        VALUES ('beta'::text, 'zeta'::text, true, true)
    $$,
    'User 1 (sender) should see beta as their main tag name with ID, zeta as user 2 main tag name without ID'
);

-- Test 2: Check that user 2 sees only their own main tag (privacy protection)
SELECT tests.authenticate_as('test_user_2');
SELECT results_eq(
    $$
        SELECT 
            (from_user).main_tag_name,
            (to_user).main_tag_name,
            (from_user).main_tag_id IS NULL as from_id_is_null,
            (to_user).main_tag_id IS NOT NULL as to_has_id
        FROM activity_feed
        WHERE event_name = 'test_event'
    $$,
    $$
        VALUES ('beta'::text, 'zeta'::text, true, true)
    $$,
    'User 2 (receiver) should see beta as user 1 main tag name without ID, zeta as their main tag name with ID'
);

-- Test 3: Verify tags array still contains all tags
SELECT tests.authenticate_as('test_user_1');
SELECT results_eq(
    $$
        SELECT 
            (from_user).tags,
            (to_user).tags
        FROM activity_feed
        WHERE event_name = 'test_event'
    $$,
    $$
        VALUES ('{alpha,beta,gamma}'::text[], '{delta,epsilon,zeta}'::text[])
    $$,
    'Tags array should contain all confirmed tags regardless of main tag'
);

-- Test 4: Change main tag and verify it updates in activity feed
SET ROLE service_role;
UPDATE send_accounts 
SET main_tag_id = (SELECT id FROM tags WHERE name = 'gamma')
WHERE user_id = tests.get_supabase_uid('test_user_1');
SET ROLE postgres;

SELECT tests.authenticate_as('test_user_1');
SELECT results_eq(
    $$
        SELECT (from_user).main_tag_name
        FROM activity_feed
        WHERE event_name = 'test_event'
    $$,
    $$
        VALUES ('gamma'::text)
    $$,
    'Activity feed should reflect updated main tag'
);

SELECT finish();
ROLLBACK;