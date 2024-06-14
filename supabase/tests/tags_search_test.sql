-- Tag Search
begin;

select plan(6);

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

-- Inserting a tag for test user
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
        null -- phone
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

-- can search by phone number
select results_eq($$
  SELECT phone_matches from tag_search( $$ || :bobs_phone_number || $$::text, 1, 0); $$, $$
    values (
      ARRAY[ROW(
        'bob_avatar', -- avatar_url
        null, -- tag_name
        $$ || :bob_send_id || $$, -- bob's send_id
        $$ || :bobs_phone_number || $$ -- bob's phone number
      )::tag_search_result]
    ) $$, 'You can search by phone number');

-- can searcch by send_id
select results_eq($$
  SELECT send_id_matches from tag_search( $$ || :alice_send_id || $$::text, 1, 0); $$, $$
    values (
      ARRAY[ROW(
        'alice_avatar', -- avatar_url
        'alice', -- tag_name
        $$ || :alice_send_id || $$, -- alice's send_id
        null -- phone
      )::tag_search_result]
    ) $$, 'You can search by send_id');

select finish();
rollback;
