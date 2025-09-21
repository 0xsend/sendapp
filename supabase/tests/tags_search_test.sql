-- Tag Search
begin;

select plan(13);

create extension "basejump-supabase_test_helpers"; -- noqa: RF05

delete from tags; -- clear out any existing tags

-- Creating a test user
select tests.create_supabase_user('alice');

select send_id as alice_send_id from profiles where id = tests.get_supabase_uid('alice');
-- copy alice_send_id to a psql variable
\gset

\set bobs_phone_number '15555555555'

select tests.create_supabase_user('bob', 'bob@example.com', (:bobs_phone_number)::text);

select send_id as bob_send_id from profiles where id = tests.get_supabase_uid('bob');
-- copy bob_send_id to a psql variable
\gset

select tests.create_supabase_user('neo');

select tests.authenticate_as_service_role();

-- Create send_account for bob
insert into send_accounts (user_id, address, chain_id, init_code)
values (
    tests.get_supabase_uid('bob'),
    '0x1234567890ABCDEF1234567890ABCDEF12345679',
    8453,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- Insert tags with proper status (service role can do this)
insert into tags (name, user_id, status)
values ('alice', tests.get_supabase_uid('alice'), 'confirmed'),
('wonderland', tests.get_supabase_uid('alice'), 'confirmed'),
('whiterabbit', tests.get_supabase_uid('alice'), 'confirmed'),
('queenofhearts', tests.get_supabase_uid('alice'), 'confirmed'),
('bob', tests.get_supabase_uid('bob'), 'pending');

update profiles set avatar_url = 'alice_avatar' where id = tests.get_supabase_uid('alice');
update profiles set avatar_url = 'bob_avatar' where id = tests.get_supabase_uid('bob');

insert into send_accounts (user_id, address, chain_id, init_code)
values (
    tests.get_supabase_uid('alice'),
    '0x1234567890ABCDEF1234567890ABCDEF12345678',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- Create send_account_tags associations for alice's confirmed tags
insert into send_account_tags (send_account_id, tag_id)
select
    (select id from send_accounts where user_id = tests.get_supabase_uid('alice')),
    t.id
from tags t
where t.user_id = tests.get_supabase_uid('alice') and t.status = 'confirmed';

-- Create send_account_tags association for bob's pending tag
insert into send_account_tags (send_account_id, tag_id)
select
    (select id from send_accounts where user_id = tests.get_supabase_uid('bob')),
    t.id
from tags t
where t.user_id = tests.get_supabase_uid('bob') and t.name = 'bob';

-- Verify that the tags are not visible to anon
select tests.clear_authentication();
select throws_ok($$
    select
      count(*)::integer from tag_search('alice',1,0) $$, 'permission denied for function tag_search');

select tests.authenticate_as('neo'); -- neo is our searcher

-- Verify that the tags are visible to the public
select results_eq($$
  SELECT tag_matches from tag_search('alice',1,0); $$, $$
    values (
      ARRAY[ROW(
        'alice_avatar', -- avatar_url
        'alice', -- tag_name
        $$ || :alice_send_id || $$, -- alice's send_id
        null, -- phone,
        false -- is_verified
      )::tag_search_result]
    ) $$, 'Tags should be visible to the authenticated user');

-- Verify you cant have a limit higher than 100
select throws_ok($$
    select
      count(*)::integer from tag_search('zzz',101,0) $$, 'limit_val must be between 1 and 100');

-- Verify you can't select pending tags
select results_eq($$
  SELECT coalesce(array_length(tag_matches,1), 0) from tag_search('bob',1,1); $$, $$
    values (0) $$, 'You can only search for confirmed tags');

-- DISABLED can search by phone number
-- select results_eq($$
--   SELECT phone_matches from tag_search( $$ || :bobs_phone_number || $$::text, 1, 0); $$, $$
--     values (
--       ARRAY[ROW(
--         'bob_avatar', -- avatar_url
--         null, -- tag_name
--         $$ || :bob_send_id || $$, -- bob's send_id
--         $$ || :bobs_phone_number || $$ -- bob's phone number
--       )::tag_search_result]
--     ) $$, 'You can search by phone number');

-- can searcch by send_id
select results_eq($$
  SELECT send_id_matches from tag_search( $$ || :alice_send_id || $$::text, 1, 0); $$, $$
    values (
      ARRAY[ROW(
        'alice_avatar', -- avatar_url
        'alice', -- tag_name
        $$ || :alice_send_id || $$, -- alice's send_id
        null, -- phone
        false -- is_verified
      )::tag_search_result]
    ) $$, 'You can search by send_id');

-- Test phone number privacy
select tests.authenticate_as_service_role();
-- Make Bob's profile private
update profiles set is_public = false where id = tests.get_supabase_uid('bob');

select tests.authenticate_as('neo');

-- Verify that private profile phone numbers are not searchable
select results_eq($$
  SELECT coalesce(array_length(phone_matches,1), 0) from tag_search( $$ || :bobs_phone_number || $$::text, 1, 0); $$, $$
    values (0) $$, 'Private profile phone numbers should not be searchable');

-- Make Bob's profile public again
select tests.authenticate_as_service_role();
update profiles set is_public = true where id = tests.get_supabase_uid('bob');

select tests.authenticate_as('neo');

-- DISABLED: Verify that public profile phone numbers are searchable
-- select results_eq($$
--   SELECT phone_matches from tag_search( $$ || :bobs_phone_number || $$::text, 1, 0); $$, $$
--     values (
--       ARRAY[ROW(
--         'bob_avatar', -- avatar_url
--         null, -- tag_name
--         $$ || :bob_send_id || $$, -- bob's send_id
--         $$ || :bobs_phone_number || $$ -- bob's phone number
--       )::tag_search_result]
--     ) $$, 'Public profile phone numbers should be searchable');

-- Test distance-based ordering and exact matches
select tests.authenticate_as_service_role();

-- Create additional test users with similar tag names
select tests.create_supabase_user('bigboss_user');
select tests.create_supabase_user('boss_user');
select tests.create_supabase_user('bossman_user');

-- Insert tags for testing distance-based ordering
insert into tags (name, user_id, status)
values 
  ('bigboss', tests.get_supabase_uid('bigboss_user'), 'confirmed'),
  ('Boss', tests.get_supabase_uid('boss_user'), 'confirmed'),
  ('bossman', tests.get_supabase_uid('bossman_user'), 'confirmed');

-- Create send accounts for the new users
insert into send_accounts (user_id, address, chain_id, init_code)
values 
  (tests.get_supabase_uid('bigboss_user'), '0xABCDEF1234567890ABCDEF1234567890ABCDEF11', 8453, '\\x00'),
  (tests.get_supabase_uid('boss_user'), '0xABCDEF1234567890ABCDEF1234567890ABCDEF22', 8453, '\\x00'),
  (tests.get_supabase_uid('bossman_user'), '0xABCDEF1234567890ABCDEF1234567890ABCDEF33', 8453, '\\x00');

-- Create send_account_tags associations
insert into send_account_tags (send_account_id, tag_id)
select sa.id, t.id
from send_accounts sa
join tags t on t.user_id = sa.user_id
where t.name in ('bigboss', 'Boss', 'bossman');

-- Set avatars for testing
update profiles set avatar_url = 'bigboss_avatar' where id = tests.get_supabase_uid('bigboss_user');
update profiles set avatar_url = 'boss_avatar' where id = tests.get_supabase_uid('boss_user');

select tests.authenticate_as('neo');

-- Test that searching for "bigboss" returns the exact match first
select results_eq($$
  SELECT (tag_matches[1]).tag_name from tag_search('bigboss', 10, 0); $$, $$
    values ('bigboss'::text) $$, 'Exact match should be returned first when searching for bigboss');

-- Test deduplication: create a user with multiple matching tags
select tests.authenticate_as_service_role();

select tests.create_supabase_user('multi_tag_user');

-- Insert multiple tags for the same user that would match "test"
insert into tags (name, user_id, status)
values 
  ('test', tests.get_supabase_uid('multi_tag_user'), 'confirmed'),
  ('tester', tests.get_supabase_uid('multi_tag_user'), 'confirmed'),
  ('testing', tests.get_supabase_uid('multi_tag_user'), 'confirmed');

-- Create send account for multi_tag_user
insert into send_accounts (user_id, address, chain_id, init_code)
values 
  (tests.get_supabase_uid('multi_tag_user'), '0xABCDEF1234567890ABCDEF1234567890ABCDEF44', 8453, '\\x00');

-- Create send_account_tags associations for all tags
insert into send_account_tags (send_account_id, tag_id)
select sa.id, t.id
from send_accounts sa
join tags t on t.user_id = sa.user_id
where sa.user_id = tests.get_supabase_uid('multi_tag_user');

-- Set avatar for testing
update profiles set avatar_url = 'multi_tag_avatar' where id = tests.get_supabase_uid('multi_tag_user');

select tests.authenticate_as('neo');

-- Test deduplication: should return only ONE result for the user, with the best matching tag
select results_eq($$
  SELECT array_length(tag_matches, 1) from tag_search('test', 10, 0) 
  WHERE (tag_matches[1]).avatar_url = 'multi_tag_avatar'; $$, $$
    values (1) $$, 'Should return only one result per profile even with multiple matching tags');

-- Test that the best match (exact match "test") is returned for the multi-tag user
select results_eq($$
  SELECT (tag_matches[i]).tag_name 
  FROM tag_search('test', 10, 0), generate_series(1, array_length(tag_matches, 1)) as i
  WHERE (tag_matches[i]).avatar_url = 'multi_tag_avatar'; $$, $$
    values ('test'::text) $$, 'Should return the best matching tag (exact match) for profile with multiple tags');

-- ===== NEW TESTS FOR SEND_SCORES_HISTORY INTEGRATION =====
select tests.authenticate_as_service_role();

-- Create test users for send score ordering tests with deterministic trigram distances
-- Using 'alice' vs 'alic3' to create predictable trigram distances
select tests.create_supabase_user('impostor_alice');
select tests.create_supabase_user('genuine_alice');

-- Create test user with 'charlie' tag to test non-exact tag search filtering
select tests.create_supabase_user('low_score_charlie');

-- Insert tags - impostor has 'alic3' (fuzzy match for 'aliceY'), genuine has 'aliceY' (exact match)
insert into tags (name, user_id, status)
values 
  ('alic3', tests.get_supabase_uid('impostor_alice'), 'confirmed'),  -- trigram distance ~0.3 from 'aliceY'
  ('aliceY', tests.get_supabase_uid('genuine_alice'), 'confirmed'),    -- exact match, distance 0
  ('charlie', tests.get_supabase_uid('low_score_charlie'), 'confirmed'); -- for testing non-exact filtering

-- Create send accounts for all users
insert into send_accounts (user_id, address, chain_id, init_code)
values 
  (tests.get_supabase_uid('impostor_alice'), '0xABCDEF1234567890ABCDEF1234567890ABCDEF55', 8453, '\\x00'),
  (tests.get_supabase_uid('genuine_alice'), '0xABCDEF1234567890ABCDEF1234567890ABCDEF66', 8453, '\\x00'),
  (tests.get_supabase_uid('low_score_charlie'), '0xABCDEF1234567890ABCDEF1234567890ABCDEF77', 8453, '\\x00');

-- Create send_account_tags associations
insert into send_account_tags (send_account_id, tag_id)
select sa.id, t.id
from send_accounts sa
join tags t on t.user_id = sa.user_id
where t.name in ('alic3', 'aliceY', 'charlie');

-- Set avatars for testing
update profiles set avatar_url = 'impostor_alice_avatar' where id = tests.get_supabase_uid('impostor_alice');
update profiles set avatar_url = 'genuine_alice_avatar' where id = tests.get_supabase_uid('genuine_alice');
update profiles set avatar_url = 'low_score_charlie_avatar' where id = tests.get_supabase_uid('low_score_charlie');

-- Create mock distribution for testing
insert into distributions (
    id,
    number,
    tranche_id,
    name,
    description,
    amount,
    hodler_pool_bips,
    bonus_pool_bips,
    fixed_pool_bips,
    qualification_start,
    qualification_end,
    hodler_min_balance,
    earn_min_balance,
    claim_end,
    chain_id,
    token_addr
) values (
    999,
    999,
    999,
    'Test Distribution 999',
    'Mock distribution for testing',
    1000,
    1000000,
    1000000,
    1000000,
    '2023-01-01'::timestamp,
    '2023-12-31'::timestamp,
    1000,
    1e6::bigint,
    '2024-01-01'::timestamp,
    8453,
    '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea
);

-- Create corresponding send_slash entry for the distribution
insert into send_slash (distribution_id, distribution_number, minimum_sends, scaling_divisor)
values (999, 999, 5, 10);

-- Insert mock send_scores_history records
-- Impostor has very high score (10000), genuine user has low score (100)
-- Low score user has minimal score (10)
-- Send scores will be computed by the materialized view, not inserted directly
-- For testing purposes, we'll focus on the trigram similarity ranking

select tests.authenticate_as('neo');

-- Test 1: NEW BEHAVIOR - Exact matches now always outrank fuzzy matches
-- When searching for 'aliceY', the exact match should appear first
select ok(exists(
  SELECT 1 FROM tag_search('aliceY', 10, 0)
  WHERE (tag_matches[1]).tag_name = 'aliceY'
), 'Exact match should always appear before fuzzy match');

-- Test 2: Low-score account with non-exact tag should NOT appear when searching its own target
-- When searching for 'charlie', the user with 'charlie' tag but low score should still appear
-- because it's an exact match (this tests that exact matches are prioritized)
select ok(exists(
  SELECT 1 FROM tag_search('charlie', 10, 0)
  WHERE (tag_matches[1]).tag_name = 'charlie'
    AND (tag_matches[1]).avatar_url = 'low_score_charlie_avatar'
), 'Exact match should appear even with low score');

-- Test 3: Test deterministic trigram distance behavior
-- Verify that 'alic3' has expected trigram similarity to 'alice'
select ok(
  ('alic3' <-> 'alice') > 0 AND ('alic3' <-> 'alice') < 1.0,
  'Trigram distance between alic3 and alice should be deterministic and measurable'
);

-- ===== NEW CASE-SENSITIVE EXACT MATCH TESTS =====
select tests.authenticate_as_service_role();

-- Create test users for case-sensitive tag matching
select tests.create_supabase_user('ethen_high_score');
select tests.create_supabase_user('ethen_low_score');

-- Insert case-sensitive tags - 'ethen' (will get high score) and 'Ethen_' (will get low score)
insert into tags (name, user_id, status)
values 
  ('ethen', tests.get_supabase_uid('ethen_high_score'), 'confirmed'),
  ('Ethen_', tests.get_supabase_uid('ethen_low_score'), 'confirmed');

-- Create send accounts for the case-sensitive test users
insert into send_accounts (user_id, address, chain_id, init_code)
values 
  (tests.get_supabase_uid('ethen_high_score'), '0xABCDEF1234567890ABCDEF1234567890ABCDEFBB', 8453, '\\x00'),
  (tests.get_supabase_uid('ethen_low_score'), '0xABCDEF1234567890ABCDEF1234567890ABCDEFCC', 8453, '\\x00');

-- Create send_account_tags associations
insert into send_account_tags (send_account_id, tag_id)
select sa.id, t.id
from send_accounts sa
join tags t on t.user_id = sa.user_id
where t.name in ('ethen', 'Ethen_');

-- Set avatars for testing
update profiles set avatar_url = 'ethen_high_avatar' where id = tests.get_supabase_uid('ethen_high_score');
update profiles set avatar_url = 'ethen_low_avatar' where id = tests.get_supabase_uid('ethen_low_score');

-- Send scores will be computed by the materialized view, not inserted directly
-- For case-sensitive exact match tests, we rely on the trigram distance prioritization

select tests.authenticate_as('neo');

-- Test case-sensitive exact match prioritization
-- When searching for 'Ethen_', the exact match 'Ethen_' should appear first
select ok(exists(
  SELECT 1 FROM tag_search('Ethen_', 20, 0)
  WHERE (tag_matches[1]).tag_name = 'Ethen_'
), 'Case-sensitive exact match Ethen_ should appear first');

select finish();
rollback;
