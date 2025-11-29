begin;

select plan(25);

-- Load the pgTAP extension
create extension if not exists pgtap;

-- Load test helpers
create extension if not exists "basejump-supabase_test_helpers";
grant usage on schema tests to service_role;
grant execute on all functions in schema tests to service_role;

-- ============================================================================
-- Test Suite: Account Deletion Core Functionality
-- ============================================================================
-- Tests for the delete_user_account() function and CASCADE behavior
-- Verifies that:
-- 1. User can be deleted via delete_user_account() function
-- 2. All related data is cascaded properly
-- 3. Manual cleanup works for temporal.send_account_transfers
-- 4. Referral and activity triggers fire correctly
-- 5. No orphaned data remains after deletion
-- ============================================================================

-- ============================================================================
-- Setup: Create test users and related data
-- ============================================================================

-- Create test users using helper function
select tests.create_supabase_user('delete_test_user1');
select tests.create_supabase_user('delete_test_user2');
select tests.create_supabase_user('delete_test_user3');

-- Create profiles for test users
insert into public.profiles (id, name)
values
  (tests.get_supabase_uid('delete_test_user1'), 'Test User 1'),
  (tests.get_supabase_uid('delete_test_user2'), 'Test User 2'),
  (tests.get_supabase_uid('delete_test_user3'), 'Test User 3')
on conflict (id) do update set
  name = excluded.name;

-- Create send_accounts for test users
insert into public.send_accounts (user_id, address, chain_id, init_code)
values
  (tests.get_supabase_uid('delete_test_user1'), '0x1111111111111111111111111111111111111111'::citext, 8453, '0xinit1'),
  (tests.get_supabase_uid('delete_test_user2'), '0x2222222222222222222222222222222222222222'::citext, 8453, '0xinit2'),
  (tests.get_supabase_uid('delete_test_user3'), '0x3333333333333333333333333333333333333333'::citext, 8453, '0xinit3');

-- Create tags for test users
insert into public.tags (name, user_id, status)
values
  ('deltest1', tests.get_supabase_uid('delete_test_user1'), 'confirmed'),
  ('deltest2', tests.get_supabase_uid('delete_test_user2'), 'confirmed'),
  ('deltest3', tests.get_supabase_uid('delete_test_user3'), 'confirmed');

-- Create chain_addresses for test users
insert into public.chain_addresses (address, user_id)
values
  ('0x1111111111111111111111111111111111111111'::citext, tests.get_supabase_uid('delete_test_user1')),
  ('0x2222222222222222222222222222222222222222'::citext, tests.get_supabase_uid('delete_test_user2')),
  ('0x3333333333333333333333333333333333333333'::citext, tests.get_supabase_uid('delete_test_user3'));

-- Create referrals (user 1 refers user 2)
insert into public.referrals (referrer_id, referred_id)
values
  (tests.get_supabase_uid('delete_test_user1'), tests.get_supabase_uid('delete_test_user2'));

-- Create activity records (multi-user transfer and solo activity)
insert into public.activity (event_name, event_id, from_user_id, to_user_id, data)
values
  -- User 1 sends to User 2 (multi-user transfer)
  ('send_account_transfers', 'transfer_1', tests.get_supabase_uid('delete_test_user1'), tests.get_supabase_uid('delete_test_user2'), '{"amount": "100"}'::jsonb),
  -- User 1 solo activity (tag purchase)
  ('tag_receipt_usdc', 'tag_receipt_1', tests.get_supabase_uid('delete_test_user1'), null, '{"tag": "deltest1"}'::jsonb),
  -- User 2 receives from User 1
  ('send_account_receives', 'receive_1', tests.get_supabase_uid('delete_test_user2'), tests.get_supabase_uid('delete_test_user1'), '{"amount": "100"}'::jsonb);

-- Create temporal.send_account_transfers (no FK constraint, requires manual cleanup)
insert into temporal.send_account_transfers (workflow_id, status, user_id, data)
values
  ('workflow_test_user1', 'initialized', tests.get_supabase_uid('delete_test_user1'), '{"from": "0x1111", "to": "0x2222", "amount": "100"}'::jsonb),
  ('workflow_test_user2', 'initialized', tests.get_supabase_uid('delete_test_user2'), '{"from": "0x2222", "to": "0x3333", "amount": "200"}'::jsonb);

-- Create receipts for test users
insert into public.receipts (user_id, hash, event_id)
values
  (tests.get_supabase_uid('delete_test_user1'), '0x1111111111111111111111111111111111111111111111111111111111111111'::citext, 'receipt_event_1'),
  (tests.get_supabase_uid('delete_test_user2'), '0x2222222222222222222222222222222222222222222222222222222222222222'::citext, 'receipt_event_2');

-- Create webauthn_credentials for test users
insert into public.webauthn_credentials (user_id, name, display_name, raw_credential_id, public_key, key_type, sign_count, attestation_object)
values
  (tests.get_supabase_uid('delete_test_user1'), 'Test Credential 1', 'Display Name 1', decode('00112233445566778899AABBCCDDEEFF', 'hex'), decode('00112233445566778899AABBCCDDEEFF', 'hex'), 'ES256', 0, decode('00112233445566778899AABBCCDDEEFF', 'hex')),
  (tests.get_supabase_uid('delete_test_user2'), 'Test Credential 2', 'Display Name 2', decode('FFEEDDCCBBAA99887766554433221100', 'hex'), decode('FFEEDDCCBBAA99887766554433221100', 'hex'), 'ES256', 0, decode('FFEEDDCCBBAA99887766554433221100', 'hex'));

-- ============================================================================
-- Test 1-5: Basic CASCADE Deletes
-- ============================================================================

-- Test 1: Verify initial data exists
select ok(
  (select count(*) from public.profiles where id = tests.get_supabase_uid('delete_test_user1')) = 1,
  'Profile exists before deletion'
);

-- Test 2: Verify send_accounts exist
select ok(
  (select count(*) from public.send_accounts where user_id = tests.get_supabase_uid('delete_test_user1')) = 1,
  'Send account exists before deletion'
);

-- Test 3: Verify tags exist
select ok(
  (select count(*) from public.tags where user_id = tests.get_supabase_uid('delete_test_user1')) = 1,
  'Tag exists before deletion'
);

-- Test 4: Verify chain_addresses exist
select ok(
  (select count(*) from public.chain_addresses where user_id = tests.get_supabase_uid('delete_test_user1')) = 1,
  'Chain address exists before deletion'
);

-- Test 5: Verify temporal.send_account_transfers exist
select ok(
  (select count(*) from temporal.send_account_transfers where user_id = tests.get_supabase_uid('delete_test_user1')) = 1,
  'Temporal transfer exists before deletion'
);

-- ============================================================================
-- Test 6-8: Activity Preservation Logic
-- ============================================================================

-- Test 6: Verify multi-user activity exists before deletion
select ok(
  (select count(*) from public.activity where event_name = 'send_account_transfers' and from_user_id = tests.get_supabase_uid('delete_test_user1') and to_user_id = tests.get_supabase_uid('delete_test_user2')) = 1,
  'Multi-user transfer activity exists before deletion'
);

-- Test 7: Verify solo activity exists before deletion
select ok(
  (select count(*) from public.activity where event_name = 'tag_receipt_usdc' and from_user_id = tests.get_supabase_uid('delete_test_user1')) = 1,
  'Solo activity exists before deletion'
);

-- Test 8: Verify recipient activity exists before deletion
select ok(
  (select count(*) from public.activity where event_name = 'send_account_receives' and from_user_id = tests.get_supabase_uid('delete_test_user2')) = 1,
  'Recipient activity exists before deletion'
);

-- ============================================================================
-- Test 9-10: Referrals and Leaderboard Before Deletion
-- ============================================================================

-- Test 9: Verify referral exists before deletion
select ok(
  (select count(*) from public.referrals where referrer_id = tests.get_supabase_uid('delete_test_user1') and referred_id = tests.get_supabase_uid('delete_test_user2')) = 1,
  'Referral exists before deletion'
);

-- Test 10: Verify leaderboard has correct count before deletion
select ok(
  (select referrals from private.leaderboard_referrals_all_time where user_id = tests.get_supabase_uid('delete_test_user1')) = 1,
  'Leaderboard shows 1 referral before deletion'
);

-- ============================================================================
-- Test 11: Execute Account Deletion
-- ============================================================================

-- Store user IDs before deletion (helper function won't work after deletion)
do $$
declare
  user1_id uuid := tests.get_supabase_uid('delete_test_user1');
  user2_id uuid := tests.get_supabase_uid('delete_test_user2');
begin
  -- Create a temporary table to store UUIDs across test statements
  create temp table if not exists test_user_ids (
    user1_id uuid,
    user2_id uuid
  );

  insert into test_user_ids (user1_id, user2_id)
  values (user1_id, user2_id);
end $$;

-- Delete user 1's account using the function
select ok(
  (select public.delete_user_account((select user1_id from test_user_ids))) is not null,
  'Account deletion function executed successfully'
);

-- ============================================================================
-- Test 12-16: Verify CASCADE Deletes
-- ============================================================================

-- Test 12: Verify user is deleted from auth.users
select ok(
  (select count(*) from auth.users where id = (select user1_id from test_user_ids)) = 0,
  'User deleted from auth.users'
);

-- Test 13: Verify profile is CASCADE deleted
select ok(
  (select count(*) from public.profiles where id = (select user1_id from test_user_ids)) = 0,
  'Profile CASCADE deleted'
);

-- Test 14: Verify send_accounts CASCADE deleted
select ok(
  (select count(*) from public.send_accounts where user_id = (select user1_id from test_user_ids)) = 0,
  'Send account CASCADE deleted'
);

-- Test 15: Verify tags CASCADE deleted
select ok(
  (select count(*) from public.tags where user_id = (select user1_id from test_user_ids)) = 0,
  'Tag CASCADE deleted'
);

-- Test 16: Verify chain_addresses CASCADE deleted
select ok(
  (select count(*) from public.chain_addresses where user_id = (select user1_id from test_user_ids)) = 0,
  'Chain address CASCADE deleted'
);

-- ============================================================================
-- Test 17: Verify Manual Deletion (temporal.send_account_transfers)
-- ============================================================================

-- Test 17: Verify temporal.send_account_transfers manually deleted
select ok(
  (select count(*) from temporal.send_account_transfers where user_id = (select user1_id from test_user_ids)) = 0,
  'Temporal transfer manually deleted'
);

-- ============================================================================
-- Test 18-20: Verify Activity Preservation and Cleanup
-- ============================================================================

-- Test 18: Verify multi-user transfer preserved with NULL from_user_id
select ok(
  (select count(*) from public.activity where event_name = 'send_account_transfers' and from_user_id is null and to_user_id = (select user2_id from test_user_ids)) = 1,
  'Multi-user transfer preserved with NULL from_user_id'
);

-- Test 19: Verify solo activity CASCADE deleted
select ok(
  (select count(*) from public.activity where event_name = 'tag_receipt_usdc' and from_user_id = (select user1_id from test_user_ids)) = 0,
  'Solo activity CASCADE deleted'
);

-- Test 20: Verify recipient activity preserved with NULL to_user_id
select ok(
  (select count(*) from public.activity where event_name = 'send_account_receives' and from_user_id = (select user2_id from test_user_ids) and to_user_id is null) = 1,
  'Recipient activity preserved with NULL to_user_id'
);

-- ============================================================================
-- Test 21-22: Verify Other Cascades
-- ============================================================================

-- Test 21: Verify receipts CASCADE deleted
select ok(
  (select count(*) from public.receipts where user_id = (select user1_id from test_user_ids)) = 0,
  'Receipts CASCADE deleted'
);

-- Test 22: Verify webauthn_credentials CASCADE deleted
select ok(
  (select count(*) from public.webauthn_credentials where user_id = (select user1_id from test_user_ids)) = 0,
  'Webauthn credentials CASCADE deleted'
);

-- ============================================================================
-- Test 23: Verify Referral CASCADE and Leaderboard Decrement
-- ============================================================================

-- Delete referred user (user 2) to test referral CASCADE
select public.delete_user_account((select user2_id from test_user_ids));

-- Test 23: Verify referral CASCADE deleted when referred user is deleted
select ok(
  (select count(*) from public.referrals where referred_id = (select user2_id from test_user_ids)) = 0,
  'Referral CASCADE deleted when referred user deleted'
);

-- Note: Leaderboard decrement for user 1 cannot be tested because user 1 was already deleted
-- This is tested separately in account_deletion_referrals_test.sql

-- ============================================================================
-- Test 24-25: Verify No Orphaned Data
-- ============================================================================

-- Test 24: Verify user 2 is deleted
select ok(
  (select count(*) from auth.users where id = (select user2_id from test_user_ids)) = 0,
  'User 2 deleted from auth.users'
);

-- Test 25: Verify user 3 remains untouched
select ok(
  (select count(*) from auth.users where id = tests.get_supabase_uid('delete_test_user3')) = 1,
  'User 3 remains untouched'
);

-- ============================================================================
-- Cleanup and Finish
-- ============================================================================

select * from finish();

rollback;
