begin;
select
  plan(2);
create extension "basejump-supabase_test_helpers";


-- Test new insert increments send_id
select tests.create_supabase_user('new_profile_user1');
select tests.create_supabase_user('new_profile_user2');

PREPARE send_id_1 AS select send_id::int from public.profiles where id = tests.get_supabase_uid('new_profile_user1');
PREPARE send_id_2 AS select send_id::int from public.profiles where id = tests.get_supabase_uid('new_profile_user2');
PREPARE send_id_2d AS select send_id::int - 1 from public.profiles where id = tests.get_supabase_uid('new_profile_user2');
select results_ne('send_id_1', 'send_id_2', 'Test new insert increments send_id and they are not the same');
select results_eq('send_id_1', 'send_id_2d', 'Test new profile insert increments send_id by 1');
select
  *
from
  finish();
ROLLBACK;