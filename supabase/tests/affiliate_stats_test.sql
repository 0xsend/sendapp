BEGIN;
SELECT
  plan(6);
-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers";
-- Create test users
SELECT
  tests.create_supabase_user('referrer');
SELECT
  tests.create_supabase_user('referred');
SELECT
  tests.create_supabase_user('other_user');
-- Create send accounts for each test user
INSERT INTO send_account_created(
  chain_id,
  log_addr,
  block_time,
  user_op_hash,
  tx_hash,
  account,
  ig_name,
  src_name,
  block_num,
  tx_idx,
  log_idx)
VALUES (
  8453,
  '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  floor(
    extract(
      EPOCH FROM timestamptz '2013-07-01 12:00:00')),
  '\x1234',
  '\x1234',
  '\x1234567890ABCDEF1234567890ABCDEF12345678',
  'send_account_created',
  'send_account_created',
  1,
  0,
  0),
(
  8453,
  '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  floor(
    extract(
      EPOCH FROM timestamptz '2013-07-01 12:00:00')),
  '\x1235',
  '\x1235',
  '\x2345678901234567890123456789012345678901',
  'send_account_created',
  'send_account_created',
  1,
  1,
  1),
(
  8453,
  '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  floor(
    extract(
      EPOCH FROM timestamptz '2013-07-01 12:00:00')),
  '\x1236',
  '\x1236',
  '\x3456789012345678901234567890123456789012',
  'send_account_created',
  'send_account_created',
  1,
  2,
  2);
INSERT INTO send_accounts(
  user_id,
  address,
  chain_id,
  init_code)
VALUES (
  tests.get_supabase_uid(
    'referrer'),
  '0x1234567890ABCDEF1234567890ABCDEF12345678',
  1,
  '\x00'),
(
  tests.get_supabase_uid(
    'referred'),
  '0x2345678901234567890123456789012345678901',
  1,
  '\x00'),
(
  tests.get_supabase_uid(
    'other_user'),
  '0x3456789012345678901234567890123456789012',
  1,
  '\x00');
-- Create test tag
INSERT INTO tags(
  name,
  created_at,
  user_id)
VALUES (
  'test_tag',
  NOW(),
  tests.get_supabase_uid(
    'referrer'));
-- Create referral relationship
INSERT INTO referrals(
  referrer_id,
  referred_id,
  tag)
VALUES (
  tests.get_supabase_uid(
    'referrer'),
  tests.get_supabase_uid(
    'referred'),
  'test_tag');
-- Test 1: Basic transfer should update send_plus_minus for sender and receiver
INSERT INTO send_token_transfers(
  f,
  t,
  v,
  block_time,
  ig_name,
  src_name,
  tx_hash,
  block_num,
  tx_idx,
  log_idx,
  abi_idx,
  chain_id,
  log_addr)
VALUES (
  '\x3456789012345678901234567890123456789012' ::bytea,
  '\x2345678901234567890123456789012345678901' ::bytea,
  100,
  floor(
    extract(
      EPOCH FROM timestamptz '2013-07-01 12:00:00')),
  'send_token_transfers',
  'send_token_transfers',
  '\x1234',
  1,
  0,
  0,
  0,
  8453,
  '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
SELECT
  results_eq($$
    SELECT
      send_plus_minus FROM affiliate_stats
      WHERE
        user_id = tests.get_supabase_uid('other_user') $$, $$
      VALUES (100::bigint) $$, 'Sender should have +100 send_plus_minus after sending');
SELECT
  results_eq($$
    SELECT
      send_plus_minus FROM affiliate_stats
      WHERE
        user_id = tests.get_supabase_uid('referred') $$, $$
      VALUES (- 100::bigint) $$, 'Receiver should have -100 send_plus_minus after receiving from non-referrer');
-- Test 2: Transfer from referrer to referred should only affect referrer's stats
INSERT INTO send_token_transfers(
  f,
  t,
  v,
  block_time,
  ig_name,
  src_name,
  tx_hash,
  block_num,
  tx_idx,
  log_idx,
  abi_idx,
  chain_id,
  log_addr)
VALUES (
  '\x1234567890ABCDEF1234567890ABCDEF12345678' ::bytea,
  '\x2345678901234567890123456789012345678901' ::bytea,
  50,
  floor(
    extract(
      EPOCH FROM timestamptz '2013-07-01 12:00:00')),
  'send_token_transfers',
  'send_token_transfers',
  '\x1235',
  1,
  1,
  1,
  0,
  8453,
  '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
SELECT
  results_eq($$
    SELECT
      send_plus_minus FROM affiliate_stats
      WHERE
        user_id = tests.get_supabase_uid('referrer') $$, $$
      VALUES (50::bigint) $$, 'Referrer should have +50 send_plus_minus after sending to referred');
SELECT
  results_eq($$
    SELECT
      send_plus_minus FROM affiliate_stats
      WHERE
        user_id = tests.get_supabase_uid('referred') $$, $$
      VALUES (- 100::bigint) $$, 'Referred user send_plus_minus should not change when receiving from referrer');
-- Test 3: Multiple transfers should accumulate correctly
INSERT INTO send_token_transfers(
  f,
  t,
  v,
  block_time,
  ig_name,
  src_name,
  tx_hash,
  block_num,
  tx_idx,
  log_idx,
  abi_idx,
  chain_id,
  log_addr)
VALUES (
  '\x2345678901234567890123456789012345678901' ::bytea,
  '\x3456789012345678901234567890123456789012' ::bytea,
  75,
  floor(
    extract(
      EPOCH FROM timestamptz '2013-07-01 12:00:00')),
  'send_token_transfers',
  'send_token_transfers',
  '\x1236',
  1,
  2,
  2,
  0,
  8453,
  '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
SELECT
  results_eq($$
    SELECT
      send_plus_minus FROM affiliate_stats
      WHERE
        user_id = tests.get_supabase_uid('referred') $$, $$
      VALUES (- 25::bigint) $$, 'Multiple transfers should accumulate correctly (-100 received + 75 sent = -25)');
-- Test 4: Authentication check
SELECT
  tests.clear_authentication();
SELECT
  is_empty($$
    SELECT
      * FROM affiliate_stats $$, 'Unauthenticated user should not see any affiliate stats');
SELECT
  *
FROM
  finish();
ROLLBACK;

