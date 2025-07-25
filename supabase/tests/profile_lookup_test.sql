BEGIN;
SELECT plan(13);
CREATE EXTENSION "basejump-supabase_test_helpers";
SELECT tests.create_supabase_user('valid_tag_user');
-- Create send account as authenticated user
SELECT tests.authenticate_as('valid_tag_user');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('valid_tag_user'),
    '0x1234567890ABCDEF1234567890ABCDEF12345678',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- Create tag using create_tag function and confirm it
SELECT create_tag('valid_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('valid_tag_user')));

-- Switch to service_role to update tag status
SELECT tests.authenticate_as_service_role();
UPDATE tags SET status = 'confirmed' WHERE name = 'valid_tag';

UPDATE profiles
SET x_username = 'x_valid_tag_user', birthday = '2025-05-14'::DATE
WHERE id = tests.get_supabase_uid('valid_tag_user');

SELECT tests.create_supabase_user('kennyl');
SELECT tests.authenticate_as_service_role();

-- Create send account for kennyl
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('kennyl'),
    '0xb0b0000000000000000000000000000000000000',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- Create tag for kennyl as authenticated kennyl user
SELECT tests.authenticate_as('kennyl');
SELECT create_tag('kennyl', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('kennyl')));

-- Switch to service_role to update tag status
SELECT tests.authenticate_as_service_role();
UPDATE tags SET status = 'confirmed' WHERE name = 'kennyl';
DO $$
DECLARE
  send_id int;
BEGIN
  send_id :=(
    SELECT
      sendid
    FROM
      public.profile_lookup('tag', 'valid_tag'));
  -- RAISE NOTICE '%', send_id;
  EXECUTE format('SET SESSION "vars.send_id" TO %L', send_id);
END;
$$
LANGUAGE plpgsql;
-- Test valid tag lookup as authenticated user
SELECT tests.authenticate_as('valid_tag_user');
SELECT results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name, links_in_bio FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (tests.get_supabase_uid('valid_tag_user'), NULL, NULL, NULL, (
        SELECT referral_code FROM profiles WHERE id = tests.get_supabase_uid('valid_tag_user')
      ), 'x_valid_tag_user', '2025-05-14'::DATE, 'valid_tag'::citext, '0x1234567890ABCDEF1234567890ABCDEF12345678'::citext, 1, TRUE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[], (
        SELECT main_tag_id FROM send_accounts WHERE user_id = tests.get_supabase_uid('valid_tag_user')
      ), 'valid_tag'::text, NULL::link_in_bio[]) $$, 'Test valid tag lookup as authenticated user');
-- Test valid tag lookup as service role
SELECT tests.authenticate_as_service_role();
SELECT results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name, links_in_bio FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, (
        SELECT referral_code FROM profiles WHERE id = tests.get_supabase_uid('valid_tag_user')
      ), 'x_valid_tag_user', '2025-05-14'::DATE, 'valid_tag'::citext, '0x1234567890ABCDEF1234567890ABCDEF12345678'::citext, 1, TRUE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[], (
        SELECT NULL::bigint
      ), 'valid_tag'::text, NULL::link_in_bio[]) $$, 'Test valid tag lookup as service role');
-- Store expected refcode before switching to anon context
DO $$
DECLARE
  expected_refcode text;
BEGIN
  SELECT referral_code INTO expected_refcode FROM profiles WHERE id = tests.get_supabase_uid('valid_tag_user');
  EXECUTE format('SET SESSION "vars.expected_refcode" TO %L', expected_refcode);
END;
$$;

-- Test valid tag lookup as anon
SELECT tests.clear_authentication();
SELECT results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name, links_in_bio FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, 
        current_setting('vars.expected_refcode')::text,
      'x_valid_tag_user', '2025-05-14'::DATE, 'valid_tag'::citext, '0x1234567890ABCDEF1234567890ABCDEF12345678'::citext, 1, TRUE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[], (
        SELECT NULL::bigint
      ), 'valid_tag'::text, NULL::link_in_bio[]) $$, 'Test valid tag lookup as anon');
-- Start tests for is_public
SELECT tests.authenticate_as_service_role();
UPDATE
profiles
SET
    is_public = FALSE
WHERE
    id = tests.get_supabase_uid('valid_tag_user');
-- Test valid tag lookup as authenticated user
SELECT tests.authenticate_as('valid_tag_user');
SELECT results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name, links_in_bio FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (tests.get_supabase_uid('valid_tag_user'), NULL, NULL, NULL, (
        SELECT referral_code FROM profiles WHERE id = tests.get_supabase_uid('valid_tag_user')
      ), NULL, NULL::DATE, 'valid_tag'::citext, '0x1234567890ABCDEF1234567890ABCDEF12345678'::citext, 1, FALSE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[], (
        SELECT main_tag_id FROM send_accounts WHERE user_id = tests.get_supabase_uid('valid_tag_user')
      ), 'valid_tag'::text, NULL::link_in_bio[]) $$, 'Test valid tag lookup as authenticated user');
-- Test valid tag lookup as service role
SELECT tests.authenticate_as_service_role();
SELECT results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name, links_in_bio FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, (
        SELECT referral_code FROM profiles WHERE id = tests.get_supabase_uid('valid_tag_user')
      ), NULL, NULL::DATE, 'valid_tag'::citext, '0x1234567890ABCDEF1234567890ABCDEF12345678'::citext, 1, FALSE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[], (
        SELECT NULL::bigint
      ), 'valid_tag'::text, NULL::link_in_bio[]) $$, 'Test valid tag lookup as service role');
-- Test invalid tag lookup as anon
SELECT tests.clear_authentication();
SELECT is_empty($$
    SELECT
      id::uuid, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name, links_in_bio FROM public.profile_lookup('tag', 'invalid_tag') $$, 'Test invalid tag lookup as anon');
SELECT tests.authenticate_as('valid_tag_user');
-- Test null profile_lookup call
SELECT throws_ok($$
    SELECT
      public.profile_lookup(NULL, 'valid_tag') $$, 'lookup_type cannot be null', 'Test null profile_lookup lookup_type call');
-- Test null identifier profile_lookup call
SELECT throws_ok($$
    SELECT
      public.profile_lookup('tag', NULL) $$, 'identifier cannot be null or empty', 'Test null identifier profile_lookup call');
-- Test invalid lookup_type profile_lookup call
SELECT throws_ok($$
    SELECT
      public.profile_lookup('invalid_lookup_type', 'valid_tag') $$, 'invalid input value for enum lookup_type_enum: "invalid_lookup_type"', 'Test invalid lookup_type profile_lookup call');
-- Test looking up kenny_ does not return kennyl
SELECT tests.authenticate_as_service_role();
SELECT results_eq($$
    SELECT
      count(*) FROM public.profile_lookup('tag', 'kenny_') $$, $$
    VALUES (
      0::bigint
    ) $$, 'Test looking up kenny_ does not return kennyl');

-- Test profile lookup by tag is case insensitive
SELECT results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name, links_in_bio FROM public.profile_lookup('tag', 'VALID_TAG') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, (
        SELECT referral_code FROM profiles WHERE id = tests.get_supabase_uid('valid_tag_user')
      ), NULL, NULL::DATE, 'valid_tag'::citext, '0x1234567890ABCDEF1234567890ABCDEF12345678'::citext, 1, FALSE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[], (
        SELECT NULL::bigint
      ), 'valid_tag'::text, NULL::link_in_bio[]) $$, 'Test valid tag lookup is case insensitive');


-- Temporarily switch to postgres role to update auth.users
SET role postgres;
UPDATE auth.users
SET phone = '+15555555555'
WHERE id = tests.get_supabase_uid('valid_tag_user');

-- Test phone lookup when profile is private
SELECT tests.clear_authentication();
SELECT is_empty($$
    SELECT
      id::uuid, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name, links_in_bio
    FROM public.profile_lookup('phone', '+15555555555')
$$, 'Test private profile cannot be found by phone number');

-- Verify the same profile can be found when public
SELECT tests.authenticate_as_service_role();
UPDATE profiles
SET is_public = TRUE
WHERE id = tests.get_supabase_uid('valid_tag_user');

SELECT results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name, links_in_bio
    FROM public.profile_lookup('phone', '+15555555555')
$$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, (
        SELECT referral_code FROM profiles WHERE id = tests.get_supabase_uid('valid_tag_user')
      ), 'x_valid_tag_user', '2025-05-14'::DATE, 'valid_tag'::citext, '0x1234567890ABCDEF1234567890ABCDEF12345678'::citext, 1, TRUE,
        (SELECT current_setting('vars.send_id')::int),
        ARRAY['valid_tag']::text[], (
        SELECT NULL::bigint
      ), 'valid_tag'::text, NULL::link_in_bio[])
$$, 'Test public profile can be found by phone number');

SELECT *
FROM
    finish();
ROLLBACK;
