begin;
select
  plan(3);
create extension "basejump-supabase_test_helpers";
select
  tests.create_supabase_user('valid_tag_user');
select
  tests.authenticate_as_service_role();
insert into tags(user_id, name, status)
  values (tests.get_supabase_uid('valid_tag_user'), 'valid_tag', 'confirmed');
insert into send_accounts(user_id, address, chain_id, init_code)
  values (tests.get_supabase_uid('valid_tag_user'), '0x1234567890ABCDEF1234567890ABCDEF12345678', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Test valid tag lookup as authenticated user
select
  tests.authenticate_as('valid_tag_user');
select
  results_eq($$
    select
      id::uuid, avatar_url, name, about, tag_name, address, chain_id, is_public from
	public.profile_lookup('valid_tag') $$, $$
    values (tests.get_supabase_uid('valid_tag_user'), null, null, null, 'valid_tag'::citext,
      '0x1234567890abcdef1234567890abcdef12345678'::citext, 1, null::boolean) $$, 'Test valid tag lookup as authenticated user');
-- Test valid tag lookup as service role
select
  tests.authenticate_as_service_role();
select
  results_eq($$
    select
      id::uuid, avatar_url, name, about, tag_name, address, chain_id, is_public from
	public.profile_lookup('valid_tag') $$, $$
    values (null::uuid, null, null, null, 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1,
      true) $$, 'Test valid tag lookup as service role');
-- Test valid tag lookup as anon
select
  tests.clear_authentication();
select
  results_eq($$
    select
      id::uuid, avatar_url, name, about, tag_name, address, chain_id, is_public from
	public.profile_lookup('valid_tag') $$, $$
    values (null::uuid, null, null, null, 'valid_tag'::citext, '0x1234567890abcdef1234567890abcdef12345678'::citext, 1,
      null::boolean) $$, 'Test valid tag lookup as anon');
select
  tests.authenticate_as('valid_tag_user');
select
  *
from
  finish();
rollback;
