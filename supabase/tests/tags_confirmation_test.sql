-- 3. Tag Confirmation
BEGIN;

SELECT plan(10);

CREATE EXTENSION "basejump-supabase_test_helpers";

GRANT USAGE ON SCHEMA tests TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO service_role;

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator');

SELECT tests.authenticate_as('tag_creator');

-- Inserting a tag for test user
INSERT INTO tags(name, user_id)
VALUES (
    'zzz1',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'zzz2',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'tag_creator_zzz',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'tag_creator_zzz2',
    tests.get_supabase_uid('tag_creator')
  );

-- Confirm tags with the service role
select tests.clear_authentication();

select set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{zzz1,zzz2,tag_creator_zzz,tag_creator_zzz2}',
    '0x1234567890123456789012345678901234567890123456789012345678901234',
    null
  );

-- Verify that the tags were confirmed
SELECT results_eq(
    $$
    SELECT count(*)::integer
    FROM tags
    WHERE status = 'confirmed'::tag_status
      and user_id = tests.get_supabase_uid('tag_creator') $$,
      $$VALUES (4) $$,
      'Tags should be confirmed'
  );

-- Verify receipt was created
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    from receipts
    WHERE hash = '0x1234567890123456789012345678901234567890123456789012345678901234' $$,
      $$VALUES (1) $$,
      'Receipt should be created'
  );

-- Verify paid tags are associated with receipt
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    from tag_receipts
    WHERE hash = '0x1234567890123456789012345678901234567890123456789012345678901234' $$,
      $$VALUES (4) $$,
      'Tags should be associated with receipt'
  );

SELECT results_eq(
    $$
    SELECT tag_name::text
    from tag_receipts
    WHERE hash = '0x1234567890123456789012345678901234567890123456789012345678901234' $$,
      $$VALUES ('zzz1'),
      ('zzz2'),
      ('tag_creator_zzz'),
      ('tag_creator_zzz2') $$,
      'Tags should be associated with receipt'
  );

-- Verify user can see receipt
SELECT tests.authenticate_as('tag_creator');

SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    from receipts
    WHERE hash = '0x1234567890123456789012345678901234567890123456789012345678901234' $$,
      $$VALUES (1) $$,
      'User should be able to see receipt'
  );

SELECT tests.create_supabase_user('hacker');

SELECT tests.authenticate_as('hacker');

-- verify hacker cannot see receipt
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    from receipts
    WHERE hash = '0x1234567890123456789012345678901234567890123456789012345678901234' $$,
      $$VALUES (0) $$,
      'Hacker should not be able to see receipt'
  );

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator_2');

SELECT tests.authenticate_as('tag_creator_2');

-- can create a common tag
INSERT INTO tags(name, user_id)
VALUES (
    'tag_creator_2',
    tests.get_supabase_uid('tag_creator_2')
  );

-- Confirm tags with the service role
select set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{tag_creator_2}',
    '0x2234567890123456789012345678901234567890123456789012345678901234',
    null
  );

-- Verify that the tags were confirmed
SELECT isnt_empty(
    $$
    SELECT count(*)::integer
    FROM tags
    WHERE status = 'confirmed'::tag_status
      and user_id = tests.get_supabase_uid('tag_creator_2')
      and name = 'tag_creator_2' $$,
      'Tags should be confirmed'
  );

-- Verify receipt was created
SELECT isnt_empty(
    $$
    SELECT COUNT(*)::integer
    from tag_receipts
    WHERE tag_name = 'tag_creator_2' $$,
      'Receipt should not be created'
  );

-- 2nd common tag requires receipt
INSERT INTO tags(name, user_id)
VALUES (
    'tag_creator_2_2',
    tests.get_supabase_uid('tag_creator_2')
  );

-- Confirm tags with the service role
select tests.clear_authentication();

select set_config('role', 'service_role', true);

SELECT throws_ok(
    $$
    SELECT confirm_tags('{tag_creator_2_2}', null, null);

$$,
'Receipt hash is required for paid tags.'
);

-- user can refer other users
select tests.authenticate_as('tag_creator_2');

INSERT INTO tags(name, user_id)
VALUES (
    'tag_creator_2_3',
    tests.get_supabase_uid('tag_creator_2')
  );

-- confirm tag with referral code
select tests.clear_authentication();

select set_config('role', 'service_role', true);

select confirm_tags(
    '{tag_creator_2_3}',
    '0x3234567890123456789012345678901234567890123456789012345678901234',
    (
      select referral_code
      from public.profiles
      where id = tests.get_supabase_uid('tag_creator')
    )
  );

select isnt_empty(
    $test$
    SELECT tag
    FROM referrals
    WHERE referrer_id = tests.get_supabase_uid('tag_creator') $test$,
      'Referral should be created'
  );

SELECT *
FROM finish();

ROLLBACK;
