BEGIN;
SELECT plan(9);
CREATE EXTENSION "basejump-supabase_test_helpers";
SELECT tests.create_supabase_user('valid_tag_user');
SELECT tests.authenticate_as_service_role();
INSERT INTO tags (user_id, name, status)
VALUES (tests.get_supabase_uid('valid_tag_user'), 'valid_tag', 'confirmed');
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('valid_tag_user'),
    '0x1234567890ABCDEF1234567890ABCDEF12345678',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);
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
      id::uuid, avatar_url, name, about, tag, address, chain_id, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (tests.get_supabase_uid('valid_tag_user'), NULL, NULL, NULL, 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1, TRUE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[]) $$, 'Test valid tag lookup as authenticated user');
-- Test valid tag lookup as service role
SELECT tests.authenticate_as_service_role();
SELECT results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, tag, address, chain_id, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1, TRUE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[]) $$, 'Test valid tag lookup as service role');
-- Test valid tag lookup as anon
SELECT tests.clear_authentication();
SELECT results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, tag, address, chain_id, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1, TRUE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[]) $$, 'Test valid tag lookup as anon');
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
      id::uuid, avatar_url, name, about, tag, address, chain_id, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (tests.get_supabase_uid('valid_tag_user'), NULL, NULL, NULL, 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1, FALSE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[]) $$, 'Test valid tag lookup as authenticated user');
-- Test valid tag lookup as service role
SELECT tests.authenticate_as_service_role();
SELECT results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, tag, address, chain_id, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1, FALSE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[]) $$, 'Test valid tag lookup as service role');
-- Test invalid tag lookup as anon
SELECT tests.clear_authentication();
SELECT is_empty($$
    SELECT
      id::uuid, avatar_url, name, about, tag, address, chain_id, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'invalid_tag') $$, 'Test invalid tag lookup as anon');
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
SELECT *
FROM
    finish();
ROLLBACK;
