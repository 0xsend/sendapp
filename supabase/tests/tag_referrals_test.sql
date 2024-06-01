-- Tag referrals test
BEGIN;

SELECT plan(7);

CREATE EXTENSION "basejump-supabase_test_helpers";

GRANT USAGE ON SCHEMA tests TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO service_role;

-- Creating a test user
SELECT tests.create_supabase_user('tag_referrer');

SELECT tests.create_supabase_user('tag_referred');

SELECT tests.authenticate_as('tag_referred');

-- Inserting a tag for test user
INSERT INTO tags (name, user_id)
VALUES (
    'zzz1',
    tests.get_supabase_uid('tag_referred')
);

-- Confirm tags with the service role
SELECT tests.clear_authentication();

SELECT set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{zzz1}',
    '0x1234567890123456789012345678901234567890123456789012345678901234',
    (
        SELECT referral_code
        FROM public.profiles
        WHERE id = tests.get_supabase_uid('tag_referrer')
    )
);

-- Verify that the tags were confirmed
SELECT isnt_empty(
    $$
    SELECT *
    FROM tags
    WHERE status = 'confirmed'::tag_status
      and user_id = tests.get_supabase_uid('tag_referred') $$,
    'Tags should be confirmed'
);

SELECT isnt_empty(
    $test$
    SELECT tag
    FROM referrals
    WHERE referrer_id = tests.get_supabase_uid('tag_referrer')
      and referred_id = tests.get_supabase_uid('tag_referred') $test$,
    'Referral should be created'
);

-- Verify user can see referral activity
SELECT tests.authenticate_as('tag_referrer');

SELECT results_eq(
    $$
   SELECT data->>'tags', (from_user).tags, (to_user).tags
   FROM activity_feed
   WHERE event_name = 'referrals'
   $$,
    $$
   VALUES ('["zzz1"]',
        null::text[],
        '{"zzz1"}'::text[]) $$,
    'verify referral activity was created'
);

-- admin deleting referral should delete activity
SELECT tests.clear_authentication();

SELECT set_config('role', 'service_role', true);

DELETE FROM referrals
WHERE
    referrer_id = tests.get_supabase_uid('tag_referrer')
    AND referred_id = tests.get_supabase_uid('tag_referred');

SELECT results_eq(
    $$
   SELECT COUNT(*)::integer
   FROM activity
   WHERE event_name = 'referrals' and event_id = sha256(decode(replace(tests.get_supabase_uid('tag_referred')::text, '-', ''), 'hex'))::text
   $$,
    $$
   VALUES (0) $$,
    'verify referral activity was deleted'
);

-- Verify invalid referral code still confirms tags
SELECT tests.authenticate_as('tag_referred');

INSERT INTO tags (name, user_id)
VALUES (
    'testzzz2',
    tests.get_supabase_uid('tag_referred')
);

-- Confirm tags with the service role
SELECT tests.clear_authentication();

SELECT set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{testzzz2}',
    '0x2234567890123456789012345678901234567890123456789012345678901234',
    'invalid'
);

-- Verify that the tags were confirmed
SELECT isnt_empty(
    $$
    SELECT *
    FROM tags
    WHERE status = 'confirmed'::tag_status
      and user_id = tests.get_supabase_uid('tag_referred')
      and name = 'testzzz2' $$,
    'Tags should be confirmed'
);

-- Verify passing my own referral code does not create a referral
SELECT tests.authenticate_as('tag_referred');

INSERT INTO tags (name, user_id)
VALUES (
    'testzzz3',
    tests.get_supabase_uid('tag_referred')
);

-- Confirm tags with the service role
SELECT tests.clear_authentication();

SELECT set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{testzzz3}',
    '0x3234567890123456789012345678901234567890123456789012345678901234',
    (
        SELECT referral_code
        FROM public.profiles
        WHERE id = tests.get_supabase_uid('tag_referred')
    )
);

-- Verify that the tags were confirmed
SELECT isnt_empty(
    $$
    SELECT *
    FROM tags
    WHERE status = 'confirmed'::tag_status
      and user_id = tests.get_supabase_uid('tag_referred')
      and name = 'testzzz3' $$,
    'Tags should be confirmed'
);

-- Verify no referral was created
SELECT is_empty(
    $$
    SELECT *
    FROM referrals
    WHERE referrer_id = tests.get_supabase_uid('tag_referred') $$,
    'Referral should not be created'
);

SELECT FINISH();

ROLLBACK;
