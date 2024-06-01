BEGIN;
SELECT plan(3);

-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers"; -- noqa: RF05

-- Create a test user and authenticate as the user
SELECT tests.create_supabase_user('bob');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('bob'),
    '0xB0B0000000000000000000000000000000000000',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- Insert a test row into send_account_signing_key_removed table
INSERT INTO send_account_signing_key_removed (
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    account,
    key_slot,
    key,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
)
VALUES (
    1,
    '\xB0B0000000000000000000000000000000000000',
    floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\xB0B0000000000000000000000000000000000000',
    0,
    '\x00',
    'send_account_signing_key_removed',
    'send_account_signing_key_removed',
    1,
    0,
    0,
    0
), (
    1,
    '\xB0B0000000000000000000000000000000000000',
    floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\xB0B0000000000000000000000000000000000000',
    0,
    '\x01',
    'send_account_signing_key_removed',
    'send_account_signing_key_removed',
    1,
    0,
    0,
    1
);

-- Test if the trigger function populated the additional columns correctly
SELECT results_eq(
    $$
        select (data->>'account')::citext as account,
        (data->>'key_slot') as key_slot,
        data->'key' as key,
        created_at, from_user_id, to_user_id
        from activity
        where event_name = 'send_account_signing_key_removed'
        and event_id = 'send_account_signing_key_removed/send_account_signing_key_removed/1/0/0'
    $$,
    $$
        VALUES ('\xB0B0000000000000000000000000000000000000'::citext,  
                '0',
                jsonb_build_array('\x00', '\x01'),
        '2013-07-01 12:00:00'::timestamptz, tests.get_supabase_uid('bob'), NULL::uuid)
    $$,
    'Test if the trigger function populated the additional columns correctly'
);

DELETE FROM send_account_signing_key_removed
WHERE id IN (
    SELECT id
    FROM send_account_signing_key_removed
    WHERE account = '\xB0B0000000000000000000000000000000000000'::bytea
);

-- Test if the delete was successful
SELECT is_empty(
    $$
        SELECT id
        FROM send_account_signing_key_removed
        WHERE account = '\xB0B0000000000000000000000000000000000000'::bytea
    $$,
    'Test if the trigger function removes the activity row'
);

-- Test if the trigger function removes the activity row
SELECT is_empty(
    $$
       select (data->>'account')::citext as account,
        (data->>'key_slot') as key_slot,
        data->'key' as key,
        created_at, from_user_id, to_user_id
        from activity
        where event_name = 'send_account_signing_key_removed'
        and event_id = 'send_account_signing_key_removed/send_account_signing_key_removed/1/0/0'
    $$,
    'Test if the trigger function removes the activity row'
);

SELECT * FROM finish();
ROLLBACK;
