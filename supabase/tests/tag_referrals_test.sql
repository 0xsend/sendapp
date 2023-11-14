-- Tag referrals test
BEGIN;

SELECT plan(5);

CREATE EXTENSION "basejump-supabase_test_helpers";

GRANT USAGE ON SCHEMA tests TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO service_role;

-- Creating a test user
SELECT tests.create_supabase_user('tag_referrer');

SELECT tests.create_supabase_user('tag_referred');

SELECT tests.authenticate_as('tag_referred');

-- Inserting a tag for test user
INSERT INTO tags(name, user_id)
VALUES (
    'zzz1',
    tests.get_supabase_uid('tag_referred')
  );

-- Confirm tags with the service role
select tests.clear_authentication();

select set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{zzz1}',
    '0x1234567890123456789012345678901234567890123456789012345678901234',
    (
      select referral_code
      from public.profiles
      where id = tests.get_supabase_uid('tag_referrer')
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

select isnt_empty(
    $test$
    SELECT tag
    FROM referrals
    WHERE referrer_id = tests.get_supabase_uid('tag_referrer')
      and referred_id = tests.get_supabase_uid('tag_referred') $test$,
      'Referral should be created'
  );

-- Verify invalid referral code still confirms tags
SELECT tests.authenticate_as('tag_referred');

INSERT INTO tags(name, user_id)
VALUES (
    'testzzz2',
    tests.get_supabase_uid('tag_referred')
  );

-- Confirm tags with the service role
select tests.clear_authentication();

select set_config('role', 'service_role', true);

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

INSERT INTO tags(name, user_id)
VALUES (
    'testzzz3',
    tests.get_supabase_uid('tag_referred')
  );

-- Confirm tags with the service role
select tests.clear_authentication();

select set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{testzzz3}',
    '0x3234567890123456789012345678901234567890123456789012345678901234',
    (
      select referral_code
      from public.profiles
      where id = tests.get_supabase_uid('tag_referred')
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

SELECT *
FROM finish();

ROLLBACK;
