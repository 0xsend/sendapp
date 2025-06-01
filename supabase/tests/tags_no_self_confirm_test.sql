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

-- User cannot confirm their first sendtag
SELECT throws_ok(
    $$
    SELECT confirm_tags(
        ARRAY['test_tag']::citext[],
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator')),
        'fake_event_id',
        NULL
      ) $$,
    'Receipt event ID does not match the sender',
    'User cannot confirm their first sendtag'
);

select tests.authenticate_as('tag_creator');

-- User can directly confirm their first sendtag
SELECT create_tag(
    'test_tagz'::citext,
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator'))
);

UPDATE tags
SET status = 'confirmed'::public.tag_status
WHERE name = 'test_tagz';

select ok(
    (SELECT EXISTS(
        SELECT 1 FROM tags
        WHERE name = 'test_tagz' AND status = 'confirmed'
    )),
    'User can confirm their first sendtag'
);

-- User cannot confirm their own second sendtag
SELECT create_tag(
    'test_tag2'::citext,
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator'))
);

select throws_ok(
    $$
        UPDATE tags
        SET status = 'confirmed'::public.tag_status
        WHERE name = 'test_tag2' $$,
    'Users cannot confirm their own tags',
    'User cannot confirm their own second sendtag'
);

SELECT finish();

ROLLBACK;
