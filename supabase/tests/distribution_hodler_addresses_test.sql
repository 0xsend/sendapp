BEGIN;
SELECT
    plan(5);
CREATE EXTENSION "basejump-supabase_test_helpers";
-- noqa: RF05
GRANT usage ON SCHEMA tests TO service_role;
GRANT EXECUTE ON ALL functions IN SCHEMA tests TO service_role;
\set hodler_address '\'f39Fd6e51aad88F6F4ce6aB8827279cffFb92266\''
-- 1. Test when provided distribution_id does not exist
SELECT
    throws_ok($$
        SELECT
            * FROM distribution_hodler_addresses(999999) $$, 'Distribution not found.', 'Should raise exception if distribution does not exist');
SELECT
    tests.create_supabase_user('hodler');
-- create a liquidity pool
INSERT INTO send_liquidity_pools(
    address,
    chain_id)
VALUES (
    decode(
        'a1b2457c0b627f97f6cc892946a382451e979014', 'hex'),
    8453);
INSERT INTO distributions(
    number,
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
    'distribution #123',
    'Description',
    100000,
    1000000,
    1000000,
    1000000,
    '2023-01-01T00:00:00.000Z',
    '2023-01-31T00:00:00.000Z',
    1e6::bigint,
    '2023-02-28T00:00:00.000Z',
    8453);
-- 2. Test when there are eligible hodler addresses
INSERT INTO public.send_token_transfers(
    "f",
    "t",
    "v",
    ig_name,
    src_name,
    block_num,
    block_time,
    tx_idx,
    log_idx,
    chain_id,
    log_addr,
    tx_hash,
    abi_idx)
VALUES ((
        SELECT
            address
        FROM
            send_liquidity_pools
        LIMIT 1),
    decode(:hodler_address, 'hex'), -- noqa: LT01
    1000000,
    'send_token_transfers',
    'send_token_transfers',
    18181005,
    extract(epoch FROM '2023-01-21 01:32:59.000000 +00:00'::timestamp),
    1,
    158,
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '\x1234',
    0);
INSERT INTO send_accounts(
    address,
    user_id,
    chain_id,
    init_code)
VALUES (
    concat(
        '0x', :hodler_address), -- noqa: LT01
    tests.get_supabase_uid(
        'hodler'),
    '8453',
    CONCAT(
        '\\x00', upper(
            CONCAT(
                md5(
                    random() ::text), md5(
                random() ::text), md5(
            random() ::text), md5(
        random() ::text)))) ::bytea);
INSERT INTO distribution_verifications(
    user_id,
    distribution_id,
    type)
VALUES (
    tests.get_supabase_uid(
        'hodler'),
(
        SELECT
            id
        FROM
            distributions
        WHERE
            number = 123), 'tag_registration');
SET ROLE TO service_role;
SELECT results_eq(
    $$SELECT address, user_id FROM distribution_hodler_addresses((SELECT id FROM distributions WHERE number = 123))$$,
    $$SELECT address, user_id FROM send_accounts WHERE user_id = tests.get_supabase_uid('hodler')$$,
    'Should return the eligible hodler addresses'
);
-- 3. Test paper hands are excluded
INSERT INTO public.send_token_transfers(
    "f",
    "t",
    "v",
    ig_name,
    src_name,
    block_num,
    block_time,
    tx_idx,
    log_idx,
    chain_id,
    log_addr,
    tx_hash,
    abi_idx)
VALUES (
    decode(
        :hodler_address, 'hex'), -- noqa: LT01
(
        SELECT
            address
        FROM send_liquidity_pools LIMIT 1),
    64509,
    'send_token_transfers',
    'send_token_transfers',
    18180534,
    extract(epoch FROM '2023-01-20 23:58:35.000000 +00:00'::timestamp),
    1,
    182,
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    '\x1234',
    0);
SELECT is_empty($$SELECT * FROM distribution_hodler_addresses((SELECT id FROM distributions WHERE number = 123))$$, 'Should return empty result when the distribution exists but user has sold');
SELECT
    tests.authenticate_as('hodler');
-- verify only service_role can call this function
SELECT
    throws_ok($$SELECT * FROM distribution_hodler_addresses((SELECT id FROM distributions WHERE number = 123)) $$, 'permission denied for function distribution_hodler_addresses', 'Should raise exception if user is not service_role');
SELECT
    tests.clear_authentication();
SELECT
    throws_ok($$SELECT * FROM distribution_hodler_addresses((SELECT id FROM distributions WHERE number = 123)) $$, 'permission denied for function distribution_hodler_addresses', 'Should raise exception if user is not authenticated');
SELECT
    finish();
ROLLBACK;

