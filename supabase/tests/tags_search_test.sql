-- Tag Search
BEGIN;
SELECT
  plan(8);
CREATE EXTENSION "basejump-supabase_test_helpers";
-- noqa: RF05
DELETE FROM tags;
-- clear out any existing tags
-- Creating test users
SELECT
  tests.create_supabase_user('alice');
SELECT
  send_id AS alice_send_id
FROM
  profiles
WHERE
  id = tests.get_supabase_uid('alice');
-- copy alice_send_id to a psql variable
\gset
\set bobs_phone_number '15555555555'
SELECT
  tests.create_supabase_user('bob', 'bob@example.com',(:bobs_phone_number)::text);
SELECT
  send_id AS bob_send_id
FROM
  profiles
WHERE
  id = tests.get_supabase_uid('bob');
-- copy bob_send_id to a psql variable
\gset
\set neo 'neo'
SELECT
  tests.create_supabase_user('neo');
-- Set avatars
UPDATE
  profiles
SET
  avatar_url = 'alice_avatar'
WHERE
  id = tests.get_supabase_uid('alice');
UPDATE
  profiles
SET
  avatar_url = 'bob_avatar'
WHERE
  id = tests.get_supabase_uid('bob');
-- Create send accounts first
SELECT
  tests.authenticate_as_service_role();
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
  VALUES (tests.get_supabase_uid('alice'), '0x1234567890ABCDEF1234567890ABCDEF12345678', 1, '\\x00112233445566778899AABBCCDDEEFF'),
(tests.get_supabase_uid('bob'), '0xB0B0000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Create receipts
INSERT INTO sendtag_checkout_receipts(chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, block_time, sender, amount, referrer, reward)
  VALUES (1, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'sendtag_checkout_receipts', 1, 0, 0, 0, -- First receipt
    1234567890, decode(substring('0x1234567890ABCDEF1234567890ABCDEF12345678' FROM 3), 'hex'), 4, '\x0000000000000000000000000000000000000000', 0),
(1, '\x5afe000000000000000000000000000000000000', '\x2234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'sendtag_checkout_receipts', 2, 0, 0, 0, -- Second receipt
    1234567890, decode(substring('0xB0B0000000000000000000000000000000000000' FROM 3), 'hex'), 1, '\x0000000000000000000000000000000000000000', 0);
-- Create tags as alice
SELECT
  tests.authenticate_as('alice');
SELECT
  create_tag(tag_name::citext,(
      SELECT
        id
      FROM send_accounts
      WHERE
        user_id = tests.get_supabase_uid('alice')))
FROM
  unnest(ARRAY['alice', 'wonderland', 'whiterabbit', 'queenofhearts']) AS tag_name;
-- Create tag as bob
SELECT
  tests.authenticate_as('bob');
SELECT
  create_tag('bob'::citext,(
      SELECT
        id
      FROM send_accounts
      WHERE
        user_id = tests.get_supabase_uid('bob')));
SELECT
  set_config('role', 'service_role', TRUE);
SELECT
  confirm_tags((ARRAY['alice', 'wonderland', 'whiterabbit', 'queenofhearts']::citext[]),(
    SELECT
      id
    FROM send_accounts
    WHERE
      user_id = tests.get_supabase_uid('alice')),(
    SELECT
      event_id
    FROM sendtag_checkout_receipts
    WHERE
      sender = decode(substring('\x1234567890ABCDEF1234567890ABCDEF12345678' FROM 3), 'hex')), NULL);
-- Confirm bob's tag
SELECT
  confirm_tags(ARRAY['bob']::citext[],(
      SELECT
        id
      FROM send_accounts
      WHERE
        user_id = tests.get_supabase_uid('bob')),(
      SELECT
        event_id
      FROM sendtag_checkout_receipts
      WHERE
        sender = decode(substring('0xB0B0000000000000000000000000000000000000' FROM 3), 'hex')), NULL);
-- Verify that the tags are not visible to anon
SELECT
  tests.clear_authentication();
SELECT
  throws_ok($$
    SELECT
      count(*)::integer FROM tag_search('alice', 1, 0) $$, 'permission denied for function tag_search');
SELECT
  tests.authenticate_as('neo');
-- neo is our searcher
-- Verify that the tags are visible to the public
SELECT
  results_eq($$
    SELECT
      tag_matches FROM tag_search('alice', 1, 0) $$, format($$VALUES (ARRAY[ROW('alice_avatar', 'alice', %L, null)::tag_search_result])$$, :alice_send_id), 'Tags should be visible to the authenticated user');
-- Verify you cant have a limit higher than 100
SELECT
  throws_ok($$
    SELECT
      count(*)::integer FROM tag_search('zzz', 101, 0) $$, 'limit_val must be between 1 and 100');
-- Verify you can't select pending tags
SELECT
  results_eq($$
    SELECT
      coalesce(array_length(tag_matches, 1), 0)
      FROM tag_search('bob', 1, 1);
$$,
$$
VALUES (0) $$,
'You can only search for confirmed tags');
-- can search by phone number
SELECT
  results_eq($$
    SELECT
      phone_matches FROM tag_search($$ || :bobs_phone_number || $$::text, 1, 0);
$$,
$$
VALUES (ARRAY[ROW ('bob_avatar', -- avatar_url
    NULL, -- tag_name
    $$ || :bob_send_id || $$, -- bob's send_id
    $$ || :bobs_phone_number || $$ -- bob's phone number
)::tag_search_result]) $$,
'You can search by phone number');
-- can searcch by send_id
SELECT
  results_eq($$
    SELECT
      send_id_matches FROM tag_search($$ || :alice_send_id || $$::text, 1, 0);
$$,
$$
VALUES (ARRAY[ROW ('alice_avatar', -- avatar_url
    'alice', -- tag_name
    $$ || :alice_send_id || $$, -- alice's send_id
    NULL -- phone
)::tag_search_result]) $$,
'You can search by send_id');
-- Test phone number privacy
SELECT
  tests.authenticate_as_service_role();
-- Make Bob's profile private
UPDATE
  profiles
SET
  is_public = FALSE
WHERE
  id = tests.get_supabase_uid('bob');
SELECT
  tests.authenticate_as('neo');
-- Verify that private profile phone numbers are not searchable
SELECT
  results_eq($$
    SELECT
      coalesce(array_length(phone_matches, 1), 0)
      FROM tag_search($$ || :bobs_phone_number || $$::text, 1, 0);
$$,
$$
VALUES (0) $$,
'Private profile phone numbers should not be searchable');
-- Make Bob's profile public again
SELECT
  tests.authenticate_as_service_role();
UPDATE
  profiles
SET
  is_public = TRUE
WHERE
  id = tests.get_supabase_uid('bob');
SELECT
  tests.authenticate_as('neo');
-- Verify that public profile phone numbers are searchable
SELECT
  results_eq($$
    SELECT
      phone_matches FROM tag_search($$ || :bobs_phone_number || $$::text, 1, 0);
$$,
$$
VALUES (ARRAY[ROW ('bob_avatar', -- avatar_url
    NULL, -- tag_name
    $$ || :bob_send_id || $$, -- bob's send_id
    $$ || :bobs_phone_number || $$ -- bob's phone number
)::tag_search_result]) $$,
'Public profile phone numbers should be searchable');
SELECT
  finish();
ROLLBACK;

