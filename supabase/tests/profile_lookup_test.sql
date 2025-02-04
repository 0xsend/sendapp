BEGIN;
SELECT
  plan(16);
CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";
-- Create test users
SELECT
  tests.create_supabase_user('valid_tag_user');
SELECT
  tests.create_supabase_user('test_user');
SELECT
  tests.create_supabase_user('kennyl');
SELECT
  tests.create_supabase_user('other_user');
SELECT
  set_config('role', 'service_role', TRUE);
-- create some sendtag_checkout_receipts
INSERT INTO sendtag_checkout_receipts(chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, block_time, sender, amount, referrer, reward)
  VALUES (8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'test_tag', 1, 0, 0, 0, 1234567890, decode(substring('0x1234567890ABCDEF1234567890ABCDEF12345678' FROM 3), 'hex'), 1, '\x0000000000000000000000000000000000000000', 0),
(8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'kennyl', 1, 0, 0, 0, 1234567890, decode(substring('0xb0b0000000000000000000000000000000000000' FROM 3), 'hex'), 1, '\x0000000000000000000000000000000000000000', 0);
-- Authenticate as valid_tag_user to create send account
SELECT
  tests.authenticate_as('valid_tag_user');
-- Create send account
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
  VALUES (tests.get_supabase_uid('valid_tag_user'), '0x1234567890ABCDEF1234567890ABCDEF12345678', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Create tag (still authenticated as valid_tag_user)
SELECT
  create_tag('valid_tag',(
      SELECT
        id
      FROM send_accounts
      WHERE
        user_id = tests.get_supabase_uid('valid_tag_user')));
-- Confirm tag as service_role
SELECT
  tests.authenticate_as_service_role();
SELECT
  confirm_tags(ARRAY['valid_tag']::citext[],(
      SELECT
        id
      FROM send_accounts
      WHERE
        user_id = tests.get_supabase_uid('valid_tag_user')),(
      SELECT
        event_id
      FROM sendtag_checkout_receipts
      WHERE
        sender = decode(substring('0x1234567890ABCDEF1234567890ABCDEF12345678' FROM 3), 'hex')), NULL);
UPDATE
  profiles
SET
  x_username = 'x_valid_tag_user'
WHERE
  id = tests.get_supabase_uid('valid_tag_user');
SELECT
  tests.authenticate_as('kennyl');
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
  VALUES (tests.get_supabase_uid('kennyl'), '0xb0b0000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');
SELECT
  create_tag('kennyl',(
      SELECT
        id
      FROM send_accounts
      WHERE
        user_id = tests.get_supabase_uid('kennyl')));
SELECT
  tests.authenticate_as_service_role();
SELECT
  confirm_tags(ARRAY['kennyl']::citext[],(
      SELECT
        id
      FROM send_accounts
      WHERE
        user_id = tests.get_supabase_uid('kennyl')),(
      SELECT
        event_id
      FROM sendtag_checkout_receipts
      WHERE
        sender = decode(substring('0xb0b0000000000000000000000000000000000000' FROM 3), 'hex')), NULL);
-- Test kenny_ lookup does not return kennyl
SELECT
  tests.authenticate_as_service_role();
SELECT
  is_empty($$
    SELECT
      id::uuid, avatar_url, name, about, x_username, tag, address, chain_id::bigint, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'kenny_') $$, 'Test kenny_ lookup does not return kennyl');
DO $$
DECLARE
  send_id int;
BEGIN
  send_id := COALESCE((
    SELECT
      sendid
    FROM public.profile_lookup('tag', 'valid_tag')), 0);
  EXECUTE format('SET SESSION "vars.send_id" TO %L', send_id);
END;
$$
LANGUAGE plpgsql;
-- Test valid tag lookup as authenticated user
SELECT
  tests.authenticate_as('valid_tag_user');
SELECT
  results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, x_username, tag, address, chain_id::bigint, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (tests.get_supabase_uid('valid_tag_user'), NULL::text, NULL::text, NULL::text, 'x_valid_tag_user'::text, 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1::bigint, TRUE,(
        SELECT
          current_setting('vars.send_id')::int), ARRAY['valid_tag']::text[]) $$, 'Test valid tag lookup as authenticated user');
-- Test valid tag lookup as service role
SELECT
  tests.authenticate_as_service_role();
SELECT
  results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, x_username, tag, address, chain_id::bigint, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, 'x_valid_tag_user', 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1::bigint, TRUE,(
        SELECT
          current_setting('vars.send_id')::int), ARRAY['valid_tag']::text[]) $$, 'Test valid tag lookup as service role');
-- Test valid tag lookup as anon
SELECT
  tests.clear_authentication();
SELECT
  results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, x_username, tag, address, chain_id::bigint, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, 'x_valid_tag_user', 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1::bigint, TRUE,(
        SELECT
          current_setting('vars.send_id')::int), ARRAY['valid_tag']::text[]) $$, 'Test valid tag lookup as anon');
-- Start tests for is_public
SELECT
  tests.authenticate_as_service_role();
UPDATE
  profiles
SET
  is_public = FALSE
WHERE
  id = tests.get_supabase_uid('valid_tag_user');
-- Test valid tag lookup as authenticated user
SELECT
  tests.authenticate_as('valid_tag_user');
SELECT
  results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, x_username, tag, address, chain_id::bigint, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (tests.get_supabase_uid('valid_tag_user'), NULL, NULL, NULL, 'x_valid_tag_user', 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1::bigint, FALSE,(
        SELECT
          current_setting('vars.send_id')::int), ARRAY['valid_tag']::text[]) $$, 'Test valid tag lookup as authenticated user');
-- Test valid tag lookup as service role
SELECT
  tests.authenticate_as_service_role();
SELECT
  results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, x_username, tag, address, chain_id::bigint, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'valid_tag') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, 'x_valid_tag_user', 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1::bigint, FALSE,(
        SELECT
          current_setting('vars.send_id')::int), ARRAY['valid_tag']::text[]) $$, 'Test valid tag lookup as service role');
-- Test invalid tag lookup as anon
SELECT
  tests.clear_authentication();
SELECT
  is_empty($$
    SELECT
      id::uuid, avatar_url, name, about, x_username, tag, address, chain_id::bigint, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'invalid_tag') $$, 'Test invalid tag lookup as anon');
SELECT
  tests.authenticate_as('valid_tag_user');
-- Test null profile_lookup call
SELECT
  throws_ok($$
    SELECT
      public.profile_lookup(NULL, 'valid_tag') $$, 'lookup_type cannot be null', 'Test null profile_lookup lookup_type call');
-- Test null identifier profile_lookup call
SELECT
  throws_ok($$
    SELECT
      public.profile_lookup('tag', NULL) $$, 'identifier cannot be null or empty', 'Test null identifier profile_lookup call');
-- Test invalid lookup_type profile_lookup call
SELECT
  throws_ok($$
    SELECT
      public.profile_lookup('invalid_lookup_type', 'valid_tag') $$, 'invalid input value for enum lookup_type_enum: "invalid_lookup_type"', 'Test invalid lookup_type profile_lookup call');
-- Test looking up kenny_ does not return kennyl
SELECT
  tests.authenticate_as_service_role();
SELECT
  results_eq($$
    SELECT
      count(*)::bigint FROM public.profile_lookup('tag', 'kenny_') $$, $$
    VALUES (0::bigint) $$, 'Test looking up kenny_ does not return kennyl');
-- Test profile lookup by tag is case insensitive
SELECT
  results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, x_username, tag, address, chain_id::bigint, is_public, sendid, all_tags FROM public.profile_lookup('tag', 'VALID_TAG') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, 'x_valid_tag_user', 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1::bigint, FALSE,(
        SELECT
          current_setting('vars.send_id')::int),ARRAY['valid_tag']::text[]) $$, 'Test valid tag lookup is case insensitive');


-- Temporarily switch to postgres role to update auth.users
SET role postgres;
UPDATE auth.users
SET phone = '+15555555555'
WHERE id = tests.get_supabase_uid('valid_tag_user');

-- Test phone lookup when profile is private
SELECT
  tests.clear_authentication();
SELECT
  is_empty($$
    SELECT
      id::uuid, avatar_url, name, about, x_username, tag, address, chain_id::bigint, is_public, sendid, all_tags FROM public.profile_lookup('phone', '+15555555555') $$, 'Test private profile cannot be found by phone number');
-- Verify the same profile can be found when public
SELECT
  tests.authenticate_as_service_role();
UPDATE
  profiles
SET
  is_public = TRUE
WHERE
  id = tests.get_supabase_uid('valid_tag_user');
SELECT
  results_eq($$
    SELECT
      id::uuid, avatar_url, name, about, x_username, tag, address, chain_id::bigint, is_public, sendid, all_tags FROM public.profile_lookup('phone', '+15555555555') $$, $$
    VALUES (NULL::uuid, NULL, NULL, NULL, 'x_valid_tag_user', 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1::bigint, TRUE,(
        SELECT
          current_setting('vars.send_id')::int), ARRAY['valid_tag']::text[]) $$, 'Test public profile can be found by phone number');
-- Create send account for test_user
SELECT
  tests.authenticate_as('test_user');
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
  VALUES (tests.get_supabase_uid('test_user'), '0x3333333333333333333333333333333333333333', -- Different address from others
    1, '\\x00112233445566778899AABBCCDDEEFF');
-- Create and confirm a tag for the user
SELECT
  tests.authenticate_as('test_user');
SELECT
  create_tag('test_tag',(
      SELECT
        id
      FROM send_accounts
      WHERE
        user_id = tests.get_supabase_uid('test_user')));
-- Confirm the tag as service_role
SELECT
  set_config('role', 'service_role', TRUE);
INSERT INTO sendtag_checkout_receipts(chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, block_time, sender, amount, referrer, reward)
  VALUES (8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901235', 'sendtag_checkout_receipts', 'test_tag', 3, 0, 0, 0, 1234567890, decode(substring('0x3333333333333333333333333333333333333333' FROM 3), 'hex'), 1, '\x0000000000000000000000000000000000000000', 0);
-- Before confirm_tags
SELECT
  set_config('client_min_messages', 'notice', FALSE);
-- Then call confirm_tags
SELECT
  confirm_tags(ARRAY['test_tag']::citext[],(
      SELECT
        id
      FROM send_accounts
      WHERE
        user_id = tests.get_supabase_uid('test_user')),(
      SELECT
        event_id
      FROM sendtag_checkout_receipts
      WHERE
        tx_hash = '\x1234567890123456789012345678901234567890123456789012345678901235'), NULL);
-- Then our original test...
SELECT
  results_eq($$
    SELECT
      main_tag_id, main_tag_name::text FROM profile_lookup('tag', 'test_tag')
      WHERE
        tag = 'test_tag' -- Add this to ensure we only get one row
        $$, $$
        SELECT
          t.id, t.name::text FROM tags t
          WHERE
            t.name = 'test_tag'
            AND t.status = 'confirmed'
            AND EXISTS (
              SELECT
                1
              FROM send_account_tags sat
              JOIN send_accounts sa ON sa.id = sat.send_account_id
              WHERE
                sat.tag_id = t.id
                AND sa.user_id = tests.get_supabase_uid('test_user'))
          LIMIT 1 $$, 'Profile lookup should return correct main tag info');
-- Test that main_tag_id and main_tag_name are included in all lookup types
SELECT
  results_eq($$
    SELECT
      main_tag_id IS NOT NULL, main_tag_name IS NOT NULL FROM profile_lookup('address', '0x1234567890ABCDEF1234567890ABCDEF12345678') $$, $$
    VALUES (TRUE, TRUE) $$, 'Profile lookup by address should include main tag fields');
SELECT
  *
FROM
  finish();
ROLLBACK;

