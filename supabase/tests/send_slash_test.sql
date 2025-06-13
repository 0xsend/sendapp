SET client_min_messages TO NOTICE;

BEGIN;
SELECT plan(5);
CREATE EXTENSION "basejump-supabase_test_helpers";

-- Switch back to service_role for tests
SELECT set_config('role', 'service_role', TRUE);

-- create test data
SELECT tests.create_supabase_user('bob');
SELECT tests.create_supabase_user('alice');
SELECT tests.create_supabase_user('charlie');

-- First set up the send_account_created entries for all addresses
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
    -- For bob
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\x1234',
    '\xB0B0000000000000000000000000000000000000',
    'send_account_created',
    'send_account_created',
    1,
    0,
    0),
-- For alice
(
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\x1234',
    '\xa71ce00000000000000000000000000000000000',
    'send_account_created',
    'send_account_created',
    2,
    0,
    0),
(
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(extract(EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\x1234',
    '\xa71ce00000000000000000000000000000000001',
    'send_account_created',
    'send_account_created',
    3,  -- New block_num
    0,
    0);

-- Create send accounts
INSERT INTO send_accounts(
    user_id,
    address,
    chain_id,
    init_code)
VALUES (
    tests.get_supabase_uid('bob'),
    '0xB0B0000000000000000000000000000000000000',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'),
(
    tests.get_supabase_uid('alice'),
    '0xa71ce00000000000000000000000000000000000',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'),
(
    tests.get_supabase_uid('charlie'),
    '0xa71ce00000000000000000000000000000000001',
    1,
    '\\x00112233445566778899AABBCCDDEEFF');

-- Add earn balances for test users
INSERT INTO send_earn_deposit(
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    sender,
    owner,
    assets,
    shares,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx
) VALUES (
    8453, -- chain_id
    '\x3f3c27fb3609151a54bf3cff33e13d1b28847eef'::bytea, -- log_addr
    EXTRACT(EPOCH FROM timestamptz '2023-01-01 00:00:00'), -- block_time
    '\x1234567890123456789012345678901234567890123456789012345678901234'::bytea, -- tx_hash
    '\xa71ce00000000000000000000000000000000000'::bytea, -- sender
    '\xa71ce00000000000000000000000000000000000'::bytea, -- owner (alice)
    10e6::numeric, -- assets
    1e6::numeric, -- shares
    'send_earn_deposit', -- ig_name
    'send_earn_deposit', -- src_name
    1, -- block_num
    0, -- tx_idx
    0, -- log_idx
    0  -- abi_idx
), (
    8453,
    '\x3f3c27fb3609151a54bf3cff33e13d1b28847eef'::bytea,
    EXTRACT(EPOCH FROM timestamptz '2023-01-01 00:00:00'),
    '\x1234567890123456789012345678901234567890123456789012345678901235'::bytea,
    '\xB0B0000000000000000000000000000000000000'::bytea,
    '\xB0B0000000000000000000000000000000000000'::bytea, -- owner (bob)
    10e6::numeric,
    1e6::numeric,
    'send_earn_deposit',
    'send_earn_deposit',
    2,
    0,
    0,
    0
),
(
    8453,
    '\x3f3c27fb3609151a54bf3cff33e13d1b28847eef'::bytea,
    EXTRACT(EPOCH FROM timestamptz '2023-01-01 00:00:00'),
    '\x1234567890123456789012345678901234567890123456789012345678901236'::bytea,
    '\xa71ce00000000000000000000000000000000000'::bytea,
    '\xa71ce00000000000000000000000000000000000'::bytea, -- first recipient
    10e6::numeric,
    1e6::numeric,
    'send_earn_deposit',
    'send_earn_deposit',
    3,
    0,
    0,
    0
), (
    8453,
    '\x3f3c27fb3609151a54bf3cff33e13d1b28847eef'::bytea,
    EXTRACT(EPOCH FROM timestamptz '2023-01-01 00:00:00'),
    '\x1234567890123456789012345678901234567890123456789012345678901237'::bytea,
    '\xa71ce00000000000000000000000000000000001'::bytea,
    '\xa71ce00000000000000000000000000000000001'::bytea, -- second recipient
    10e6::numeric,
    1e6::numeric,
    'send_earn_deposit',
    'send_earn_deposit',
    4,
    0,
    0,
    0
);

DELETE FROM distributions
WHERE qualification_start <= (now() AT TIME ZONE 'UTC')
AND qualification_end >= (now() AT TIME ZONE 'UTC');

-- Create distribution with explicit time period relative to now()
INSERT INTO distributions(
    number,
    tranche_id,
    name,
    description,
    amount,
    hodler_pool_bips,
    bonus_pool_bips,
    fixed_pool_bips,
    qualification_start,
    qualification_end,
    hodler_min_balance,
    earn_min_balance,
    claim_end,
    chain_id,
    token_addr)
VALUES (
    123,
    123,
    'distribution #123',
    'Description',
    100000,
    1000000,
    1000000,
    1000000,
    (now() AT TIME ZONE 'UTC')::timestamp(3)::timestamptz - interval '1 day',
    (now() AT TIME ZONE 'UTC')::timestamp(3)::timestamptz + interval '29 days',
    1000::bigint,
    1e6::bigint,
    (now() AT TIME ZONE 'UTC')::timestamp(3)::timestamptz + interval '30 days',
    8453,
    '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea);

-- Add send slash settings for current distribution
INSERT INTO send_slash(
    distribution_id,
    distribution_number,
    minimum_sends,
    scaling_divisor)
VALUES (
    (SELECT id FROM distributions WHERE number = 123),
    123,
    10,
    1);

INSERT INTO public.distribution_verification_values(
    type,
    fixed_value,
    bips_value,
    distribution_id)
VALUES (
    'send_ceiling',
    0,
    0,
    (SELECT id FROM distributions WHERE number = 123));

-- ensure verification values are not created
INSERT INTO distribution_verification_values(
    type,
    fixed_value,
    bips_value,
    distribution_id,
    multiplier_min,
    multiplier_max,
    multiplier_step)
SELECT
    type,
    fixed_value,
    bips_value,
    (SELECT id FROM distributions WHERE number = 123),
    multiplier_min,
    multiplier_max,
    multiplier_step
FROM distribution_verification_values
WHERE distribution_id = (
    SELECT id
    FROM distributions
    WHERE number <> 123
    ORDER BY number DESC
    LIMIT 1)
AND type NOT IN (
    SELECT type
    FROM distribution_verification_values
    WHERE distribution_id = (
        SELECT id
        FROM distributions
        WHERE number = 123));

-- Test 1: Initial check for no verification
SELECT results_eq($$
    SELECT COUNT(*)::integer
    FROM distribution_verifications
    WHERE user_id = tests.get_supabase_uid('bob')
        AND type = 'send_ceiling'
        AND distribution_id = (
            SELECT id
            FROM distributions
            WHERE number = 123)
$$,
$$VALUES (0)$$,
'No send_ceiling verification should exist initially');

-- Insert send_token_transfers to trigger verification creation
-- First send: 1e4 tokens (below ceiling)
INSERT INTO send_token_transfers(
    f,
    t,
    v,
    block_time,
    chain_id,
    tx_hash,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx,
    log_addr)
VALUES (
    '\xB0B0000000000000000000000000000000000000'::bytea,
    '\xa71ce00000000000000000000000000000000000'::bytea,
    10::bigint,
    EXTRACT(EPOCH FROM (
        (SELECT qualification_start FROM distributions WHERE number = 123) + interval '1 hour'
    )),    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901234'::bytea,
    'send_token_transfers',
    'send_token_transfers',
    1, 0, 0, 0,
    '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea);

SELECT results_eq($$
    SELECT
        user_id,
        score::text,
        unique_sends::bigint,
        send_ceiling::text
    FROM send_scores_current
    WHERE user_id = tests.get_supabase_uid('bob')
$$,
$$VALUES (
    tests.get_supabase_uid('bob'),
    10::text,
    1::bigint,
    100::text
)$$,
'Scores should be calculated correctly in send_scores_current');

-- Test 3: Verify send_ceiling verification was created with correct initial values
SELECT results_eq($$
    SELECT
        weight::text,
        (metadata->>'value')::text
    FROM distribution_verifications
    WHERE type = 'send_ceiling'
        AND distribution_id = (
            SELECT id
            FROM distributions
            WHERE number = 123)
        AND user_id = tests.get_supabase_uid('bob')
$$,
$$VALUES (10::text, 100::text)$$,
'First send should create verification with correct weight and ceiling value');

-- Second send: 9999 tokens (above ceiling)
INSERT INTO send_token_transfers(
    f,
    t,
    v,
    block_time,
    chain_id,
    tx_hash,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx,
    log_addr)
VALUES (
    '\xB0B0000000000000000000000000000000000000'::bytea,
    '\xa71ce00000000000000000000000000000000001'::bytea,
    9999::bigint,
    EXTRACT(EPOCH FROM (
        (SELECT qualification_start FROM distributions WHERE number = 123) + interval '2 hour'
    )),
    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901235'::bytea,
    'send_token_transfers',
    'send_token_transfers',
    2, 0, 0, 0,
    '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea);

-- For Test 4 after the 9999 send
SELECT results_eq($$
    SELECT
        weight::text,
        (metadata->>'value')::text
    FROM distribution_verifications
    WHERE type = 'send_ceiling'
        AND distribution_id = (
            SELECT id
            FROM distributions
            WHERE number = 123)
        AND user_id = tests.get_supabase_uid('bob')
$$,
$$VALUES (110::text, 100::text)$$,
'Weight should increase by ceiling value (100) when send amount exceeds ceiling');

-- Third send: repeated send to first recipient
INSERT INTO send_token_transfers(
    f,
    t,
    v,
    block_time,
    chain_id,
    tx_hash,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx,
    log_addr)
VALUES (
    '\xB0B0000000000000000000000000000000000000'::bytea,
    '\xa71ce00000000000000000000000000000000001'::bytea,
    1000::bigint,
    EXTRACT(EPOCH FROM (
        (SELECT qualification_start FROM distributions WHERE number = 123) + interval '3 hour'
    )),
    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901236'::bytea,
    'send_token_transfers',
    'send_token_transfers',
    3, 0, 0, 0,
    '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea);

-- Test 5
SELECT results_eq($$
    SELECT weight::text
    FROM distribution_verifications
    WHERE type = 'send_ceiling'
        AND distribution_id = (
            SELECT id
            FROM distributions
            WHERE number = 123)
        AND user_id = tests.get_supabase_uid('bob')
$$,
$$VALUES (110::text)$$,
'Weight should not increase for repeated recipient already at ceiling');

SELECT finish();
ROLLBACK;

RESET client_min_messages;