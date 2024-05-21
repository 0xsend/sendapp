BEGIN;
SELECT plan(3);

-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers";

-- Create a test user and authenticate as the user
SELECT tests.create_supabase_user('bob');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('bob'), '0xB0B0000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');

-- Insert a test row into send_account_created table
INSERT INTO send_account_created (
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
    log_idx,
    id
)
VALUES (
    1,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(EXTRACT(EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\x1234',
    '\xB0B0000000000000000000000000000000000000',
    'send_account_created',
    'send_account_created',
    1,
    0,
    0,
    0
);

-- Test if the trigger function populated the additional columns correctly
SELECT results_eq(
               $$
        select (data->>'account')::citext as account, created_at, from_user_id, to_user_id
        from activity
        where event_name = 'send_account_created'
        and event_id = 'send_account_created/send_account_created/1/0/0'
    $$,
    $$
        VALUES ('\xB0B0000000000000000000000000000000000000'::citext,  '2013-07-01 12:00:00'::timestamptz, NULL::uuid, tests.get_supabase_uid('bob')) 
    $$,
               'Test if the trigger function populated the additional columns correctly'
       );

DELETE FROM send_account_created
WHERE id = (
    SELECT id
    FROM send_account_created
    WHERE account = '\xB0B0000000000000000000000000000000000000'::bytea
);

-- Test if the delete was successful
SELECT is_empty(
    $$
        SELECT id
        FROM send_account_created
        WHERE account = '\xB0B0000000000000000000000000000000000000'::bytea
    $$,
    'Test if the trigger function removes the activity row'
);

-- Test if the trigger function removes the activity row
SELECT is_empty(
    $$
        select (data->>'account')::citext as account, created_at, from_user_id, to_user_id
        from activity
        where event_name = 'send_account_created'
        and event_id = 'send_account_created/send_account_created/1/0/0'
    $$,
    'Test if the trigger function removes the activity row'
);

SELECT * FROM finish();
ROLLBACK;
