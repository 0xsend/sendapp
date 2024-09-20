BEGIN;
SELECT
  plan(4);
-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers";
-- noqa: RF05
-- Create a test user and authenticate as the user
SELECT
  tests.create_supabase_user('test_user_from');
SELECT
  tests.create_supabase_user('test_user_to');
INSERT INTO send_account_created(chain_id, log_addr, block_time, user_op_hash, tx_hash, account, ig_name, src_name, block_num, tx_idx, log_idx)
  VALUES (8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')), '\x1234', '\x1234', '\x1234567890ABCDEF1234567890ABCDEF12345678', 'send_account_created', 'send_account_created', 1, 0, 0),
(8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')), '\x1234', '\x1234', '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA', 'send_account_transfers', 'send_account_transfers', 1, 0, 0);
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
  VALUES (tests.get_supabase_uid('test_user_from'), '0x1234567890ABCDEF1234567890ABCDEF12345678', 1, '\\x00112233445566778899AABBCCDDEEFF'),
(tests.get_supabase_uid('test_user_to'), '0xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Insert a test row into send_account_transfers table
-- Send 2 transfers from test_user_from to paymaster
INSERT INTO send_account_transfers(f, t, v, block_time, ig_name, src_name, tx_hash, block_num, tx_idx, log_idx, abi_idx, chain_id, log_addr)
  VALUES ('\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea, '\x592e1224d203be4214b15e205f6081fbbacfcd2d'::bytea, 100, floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')), 'send_account_transfers', 'send_account_transfers', '\x1234', 1, 0, 0, 0, 8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
INSERT INTO send_account_transfers(f, t, v, block_time, ig_name, src_name, tx_hash, block_num, tx_idx, log_idx, abi_idx, chain_id, log_addr)
  VALUES ('\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea, '\x592e1224d203be4214b15e205f6081fbbacfcd2d'::bytea, 200, floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')), 'send_account_transfers', 'send_account_transfers', '\x1235', 1, 1, 1, 1, 8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
-- Send 1 paymaster transfer that is not to the paymaster
INSERT INTO send_account_transfers(f, t, v, block_time, ig_name, src_name, tx_hash, block_num, tx_idx, log_idx, abi_idx, chain_id, log_addr)
  VALUES ('\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea, '\x888e1224d203be4214b15e205f6081fbbacfcddd'::bytea, 100, floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')), 'send_account_transfers', 'send_account_transfers', '\x1236', 1, 2, 2, 2, 8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
-- Send 1 paymaster transfer from test_user_to to paymaster
INSERT INTO send_account_transfers(f, t, v, block_time, ig_name, src_name, tx_hash, block_num, tx_idx, log_idx, abi_idx, chain_id, log_addr)
  VALUES ('\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea, '\x4c99cdaab0cfe32b4ba77d30342b5c51e0444e5b'::bytea, 100, floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')), 'send_account_transfers', 'send_account_transfers', '\x1237', 1, 3, 3, 3, 8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
-- Test if the trigger function populated the additional columns correctly
SELECT
  results_eq($$
    SELECT
      (data ->> 'log_addr')::citext AS log_addr,(data ->> 'f')::citext AS f,(data ->> 't')::citext AS t,(data ->> 'v') AS v,(data ->> 'tx_hash')::citext AS tx_hash,(data ->> 'block_num')::text AS block_num,(data ->> 'tx_idx')::text AS tx_idx,(data ->> 'log_idx')::text AS log_idx, created_at, from_user_id FROM activity
      WHERE
        event_name = 'send_account_transfers'
        AND event_id = 'send_account_transfers/send_account_transfers/1/0/0' $$, $$
      VALUES ('\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'::citext, '\x1234567890ABCDEF1234567890ABCDEF12345678'::citext, '\x592e1224d203be4214b15e205f6081fbbacfcd2d'::citext, 100::text, '\x1234'::citext, '1'::text, '0'::text, '0'::text, timestamptz '2013-07-01 12:00:00', tests.get_supabase_uid('test_user_from')) $$, 'Test if the trigger function populated the additional columns correctly');
SELECT
  tests.authenticate_as('test_user_from');
SELECT
  results_eq($$
    SELECT
      paymaster_tx_count FROM affiliate_stats
      WHERE
        user_id = tests.get_supabase_uid('test_user_from') $$, $$
      VALUES (2::bigint) $$, 'Test if the trigger function increments the paymaster_tx_count correctly');
SELECT
  tests.authenticate_as('test_user_to');
SELECT
  results_eq($$
    SELECT
      paymaster_tx_count FROM affiliate_stats
      WHERE
        user_id = tests.get_supabase_uid('test_user_to') $$, $$
      VALUES (1::bigint) $$, 'Test if the trigger function increments the paymaster_tx_count correctly');
SELECT
  tests.clear_authentication();
SELECT
  is_empty($$
    SELECT
      * FROM affiliate_stats $$, 'Test if the affiliate_stats view returns no data for an unauthenticated user');
SELECT
  *
FROM
  finish();
ROLLBACK;

