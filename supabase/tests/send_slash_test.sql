SET client_min_messages TO NOTICE;

BEGIN;
SELECT plan(5);
CREATE EXTENSION "basejump-supabase_test_helpers";
SELECT set_config('role', 'service_role', TRUE);

-- create test data
SELECT tests.create_supabase_user('bob');
SELECT tests.create_supabase_user('alice');

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
    '\\x00112233445566778899AABBCCDDEEFF');

-- Create distribution with explicit time period
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
    claim_end,
    chain_id)
VALUES (
    123,
    123,
    'distribution #123',
    'Description',
    100000,
    1000000,
    1000000,
    1000000,
    '2023-01-01 00:00:00'::timestamp,
    '2023-01-31 23:59:59'::timestamp,
    1e6::bigint,
    '2023-02-01 23:59:59'::timestamp,
    8453);

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
    1e4::bigint,
    EXTRACT(EPOCH FROM ((
        SELECT qualification_start
        FROM distributions
        WHERE number = 123) + interval '1 hour')),
    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901234'::bytea,
    'send_token_transfers',
    'send_token_transfers',
    1, 0, 0, 0,
    '\x3f3c27fb3609151a54bf3cff33e13d1b28847eef'::bytea);

-- Test 2: Verify send_ceiling verification was created with correct initial values
SELECT results_eq($$
    SELECT
        weight::text,
        (metadata->>'value')::text,
        jsonb_array_length(metadata->'sent_to')::integer
    FROM distribution_verifications
    WHERE type = 'send_ceiling'
        AND distribution_id = (
            SELECT id
            FROM distributions
            WHERE number = 123)
        AND user_id = tests.get_supabase_uid('bob')
$$,
$$VALUES (1e4::text, 1e5::text, 1)$$,
'First send should create verification with correct weight and one recipient');

-- Second send: 1e6 tokens (above ceiling)
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
    1e6::bigint,
    EXTRACT(EPOCH FROM ((
        SELECT qualification_start
        FROM distributions
        WHERE number = 123) + interval '1 hour')),
    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901235'::bytea,
    'send_token_transfers',
    'send_token_transfers',
    2, 0, 0, 0,
    '\x3f3c27fb3609151a54bf3cff33e13d1b28847eef'::bytea);

-- Test 3: Send amount greater than ceiling only adds ceiling value
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
$$VALUES ((1e4 + 1e5)::text, 1e5::text)$$,
'Weight should increase by ceiling value (1e5) when send amount exceeds ceiling');

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
    '\xa71ce00000000000000000000000000000000000'::bytea,
    1e4::bigint,
    EXTRACT(EPOCH FROM ((
        SELECT qualification_start
        FROM distributions
        WHERE number = 123) + interval '1 hour')),
    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901236'::bytea,
    'send_token_transfers',
    'send_token_transfers',
    3, 0, 0, 0,
    '\x3f3c27fb3609151a54bf3cff33e13d1b28847eef'::bytea);

-- Test 4: Repeated send to first recipient doesn't increase weight
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
$$VALUES ((1e4 + 1e5)::text)$$,
'Weight should not increase for repeated recipient');

-- Test 5: Verify sent_to array contains correct number of recipients
SELECT results_eq($$
    SELECT jsonb_array_length(metadata->'sent_to')::integer
    FROM distribution_verifications
    WHERE type = 'send_ceiling'
        AND distribution_id = (
            SELECT id
            FROM distributions
            WHERE number = 123)
        AND user_id = tests.get_supabase_uid('bob')
$$,
$$VALUES (2)$$,
'Should have exactly 2 unique recipients');

SELECT finish();
ROLLBACK;

RESET client_min_messages;