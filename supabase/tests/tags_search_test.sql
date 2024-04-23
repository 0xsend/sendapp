-- Tag Search
begin;
select
  plan(3);
create extension "basejump-supabase_test_helpers";
truncate tags cascade;
-- Creating a test user
select
  tests.create_supabase_user('tag_creator');
select
  tests.authenticate_as_service_role();
-- Inserting a tag for test user
insert into tags(name, user_id, status)
  values ('zzz1', tests.get_supabase_uid('tag_creator'), 'confirmed'),
('zzz2', tests.get_supabase_uid('tag_creator'), 'confirmed'),
('tag_creator_zzz', tests.get_supabase_uid('tag_creator'), 'confirmed'),
('tag_creator_zzz2', tests.get_supabase_uid('tag_creator'), 'confirmed');
insert into send_accounts(user_id, address, chain_id, init_code)
  values (tests.get_supabase_uid('tag_creator'), '0x1234567890ABCDEF1234567890ABCDEF12345678', 1, '\\x00112233445566778899AABBCCDDEEFF');
select
  tests.clear_authentication();
-- Verify that the tags are not visible to anon
select
  throws_ok($$
    select
      count(*)::integer from tag_search('zzz') $$, 'permission denied for function tag_search');
select
  tests.create_supabase_user('tag_searcher');
select
  tests.authenticate_as('tag_searcher');
-- Verify that the tags are visible to the public
select
  results_eq($$
  SELECT jsonb_array_length(tag_matches) from tag_search('zzz'); $$, $$
    values (4) $$, 'Tags should be visible to the public');

-- Verify you cant have a limit higher than 100
select
  throws_ok($$
    select
      count(*)::integer from tag_search('zzz', 101) $$, 'limit_val must be between 1 and 100');
select
  *
from
  finish();
rollback;
