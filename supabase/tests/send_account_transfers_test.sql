BEGIN;
SELECT plan(5);

-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers"; -- noqa: RF05

-- Create a test user and authenticate as the user
SELECT tests.create_supabase_user('test_user_from');
SELECT tests.create_supabase_user('test_user_to');

insert into send_account_created (chain_id, log_addr, block_time, user_op_hash, tx_hash, account, ig_name, src_name, block_num, tx_idx, log_idx)
values (8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')), '\x1234', '\x1234', '\x1234567890ABCDEF1234567890ABCDEF12345678', 'send_account_created', 'send_account_created', 1, 0, 0),
       (8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')), '\x1234', '\x1234', '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA', 'send_account_transfers', 'send_account_transfers', 1, 0, 0);

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('test_user_from'),
    '0x1234567890ABCDEF1234567890ABCDEF12345678',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
),
(
    tests.get_supabase_uid('test_user_to'),
    '0xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- Insert a test row into send_account_transfers table
INSERT INTO send_account_transfers (
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
    log_addr
)
VALUES (
    '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea,
    '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea,
    100,
    floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    'send_account_transfers',
    'send_account_transfers',
    '\x1234',
    1,
    0,
    0,
    0,
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
);

-- Test if the trigger function populated the additional columns correctly
SELECT results_eq(
    $$
        select
            (data->>'log_addr')::citext as log_addr,
            (data->>'f')::citext as f,
            (data->>'t')::citext as t,
            (data->>'v') as v,
            (data->>'tx_hash')::citext as tx_hash,
            (data->>'block_num')::text as block_num,
            (data->>'tx_idx')::text as tx_idx,
            (data->>'log_idx')::text as log_idx,
            created_at,
            from_user_id,
            to_user_id
        from activity
        where event_name = 'send_account_transfers'
        and event_id = 'send_account_transfers/send_account_transfers/1/0/0'
    $$,
    $$
        VALUES (
            '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'::citext,
            '\x1234567890ABCDEF1234567890ABCDEF12345678'::citext,
            '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::citext,
            100::text,
            '\x1234'::citext,
            '1'::text,
            '0'::text,
            '0'::text,
            timestamptz '2013-07-01 12:00:00',
            tests.get_supabase_uid('test_user_from'),
            tests.get_supabase_uid('test_user_to'))
    $$,
    'Test if the trigger function populated the additional columns correctly'
);

DELETE FROM send_account_transfers
WHERE id = (
    SELECT id
    FROM send_account_transfers
    WHERE
        f = '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea
        AND t = '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea
);

-- Test if the delete was successful
SELECT is_empty(
    $$
        SELECT id
        FROM send_account_transfers
        WHERE f = '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea AND t = '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea
    $$,
    'Test if the trigger function removes the activity row'
);

-- Test if the trigger function removes the activity row
SELECT is_empty(
    $$
        select data->>'f' as f, data->>'t' as t, data->>'v' as v, data->>'tx_hash' as tx_hash, created_at, from_user_id, to_user_id
        from activity
        where event_name = 'send_account_transfers'
        and event_id = 'send_account_transfers/send_account_transfers/1/0/0'
    $$,
    'Test if the trigger function removes the activity row'
);

-- Test filter_non_send_account_transfers_before_insert removes transactions when the sender is not a send account
delete from send_account_transfers;
INSERT INTO send_account_transfers (
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
    log_addr
)
VALUES (
    '\xa71CE00000000000000000000000000000000000',
    '\xb055000000000000000000000000000000000000',
    100,
    floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    'send_account_transfers',
    'send_account_transfers',
    '\x1234',
    1,
    0,
    0,
    0,
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
);

SELECT is_empty(
    $$
        select 1
        from send_account_transfers
        where f = '\xa71CE00000000000000000000000000000000000'
    $$,
    'Test if the trigger function filters send_account_transfers with no send_account_created'
);

select is_empty(
    $$
        select 1
        from send_account_transfers
    $$,
    'Test if the trigger function filters send_account_transfers with no send_account_created'
);

SELECT * FROM finish();
ROLLBACK;
