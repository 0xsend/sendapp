-- 4. Tag Self-Confirmation
BEGIN;

SELECT plan(3);

CREATE EXTENSION "basejump-supabase_test_helpers"; -- noqa: RF05

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator');

SELECT tests.authenticate_as('tag_creator');

-- Create a send_account for the test user
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('tag_creator'), '0x1234567890123456789012345678901234567890', 8453, '\\x00');

-- Use create_tag function to properly create tag with association
SELECT create_tag(
    'test_tag'::citext,
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator'))
);

-- Confirm tags with the service role
SELECT tests.clear_authentication();
SELECT set_config('role', 'service_role', true);

-- Trying to confirm the tag as the tag owner (should raise an exception)
SELECT throws_ok(
    $$
    SELECT confirm_tags(
        ARRAY['test_tag']::citext[],
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator')),
        'fake_event_id',
        NULL
      ) $$,
    'Receipt event ID does not match the sender',
    'User should not be able to confirm their own tag'
);

select tests.authenticate_as('tag_creator');

-- Bypassing rpc call to confirm tag - create another tag first then try to confirm it
SELECT create_tag(
    'test_tagz'::citext,
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator'))
);

SELECT throws_ok(
    $$
    UPDATE tags
    SET status = 'confirmed'::public.tag_status
    WHERE name = 'test_tagz' $$,
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
