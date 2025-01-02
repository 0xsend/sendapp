SET client_min_messages TO NOTICE;

BEGIN;
SELECT
    plan(25);
CREATE EXTENSION "basejump-supabase_test_helpers";
SELECT
    set_config('role', 'service_role', TRUE);
-- create test data
SELECT
    tests.create_supabase_user('bob');
SELECT
    tests.create_supabase_user('alice');
SELECT
    tests.create_supabase_user('recipient1');
SELECT
    tests.create_supabase_user('recipient2');
SELECT
    tests.create_supabase_user('recipient3');
SELECT
    tests.create_supabase_user('recipient4');
SELECT
    tests.create_supabase_user('recipient5');
SELECT
    tests.create_supabase_user('recipient6');
SELECT
    tests.create_supabase_user('recipient7');
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
    floor(
        extract(
            EPOCH FROM timestamptz '2013-07-01 12:00:00')),
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
    8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', floor(
        extract(
            EPOCH FROM timestamptz '2013-07-01 12:00:00')), '\x1234', '\x1234', '\xa71ce00000000000000000000000000000000000', 'send_account_created', 'send_account_created', 2, 0, 0),
-- For recipient1-4
(
    8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', floor(
        extract(
            EPOCH FROM timestamptz '2013-07-01 12:00:00')), '\x1234', '\x1234', '\xa71ce00000000000000000000000000000000001', 'send_account_created', 'send_account_created', 3, 1, 0),
(
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(
        extract(
            EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\x1234',
    '\xa71ce00000000000000000000000000000000002',
    'send_account_created',
    'send_account_created',
    4,
    2,
    0),
(
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(
        extract(
            EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\x1234',
    '\xa71ce00000000000000000000000000000000003',
    'send_account_created',
    'send_account_created',
    5,
    3,
    0),
(
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(
        extract(
            EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\x1234',
    '\xa71ce00000000000000000000000000000000004',
    'send_account_created',
    'send_account_created',
    6,
    4,
    0),
(
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(
        extract(
            EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\x1234',
    '\xa71ce00000000000000000000000000000000005',
    'send_account_created',
    'send_account_created',
    7,
    4,
    0),
(
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(
        extract(
            EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\x1234',
    '\xa71ce00000000000000000000000000000000006',
    'send_account_created',
    'send_account_created',
    8,
    4,
    0),
(
    8453,
    '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    floor(
        extract(
            EPOCH FROM timestamptz '2013-07-01 12:00:00')),
    '\x1234',
    '\x1234',
    '\xa71ce00000000000000000000000000000000007',
    'send_account_created',
    'send_account_created',
    9,
    4,
    0);
-- Create send accounts
INSERT INTO send_accounts(
    user_id,
    address,
    chain_id,
    init_code)
VALUES (
    tests.get_supabase_uid(
        'bob'),
    '0xB0B0000000000000000000000000000000000000',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'),
(
    tests.get_supabase_uid(
        'alice'),
    '0xa71ce00000000000000000000000000000000000',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'),
(
    tests.get_supabase_uid(
        'recipient1'),
    '0xa71ce00000000000000000000000000000000001',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'),
(
    tests.get_supabase_uid(
        'recipient2'),
    '0xa71ce00000000000000000000000000000000002',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'),
(
    tests.get_supabase_uid(
        'recipient3'),
    '0xa71ce00000000000000000000000000000000003',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'),
(
    tests.get_supabase_uid(
        'recipient4'),
    '0xa71ce00000000000000000000000000000000004',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'),
(
    tests.get_supabase_uid(
        'recipient5'),
    '0xa71ce00000000000000000000000000000000005',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'),
(
    tests.get_supabase_uid(
        'recipient6'),
    '0xa71ce00000000000000000000000000000000006',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'),
(
    tests.get_supabase_uid(
        'recipient7'),
    '0xa71ce00000000000000000000000000000000007',
    1,
    '\\x00112233445566778899AABBCCDDEEFF');
-- bob can register and confirm tags with valid receipts
SELECT
    tests.authenticate_as('bob');
-- Inserting a tag for test user
INSERT INTO tags(
    name,
    user_id)
VALUES (
    'bob',
    tests.get_supabase_uid(
        'bob'));
-- Confirm tags with the service role
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
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
    -- start now
    (SELECT CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(
        SELECT
            CURRENT_TIMESTAMP AT TIME ZONE 'UTC' + interval '10 days'),
        1e6::bigint,
(
            SELECT
                CURRENT_TIMESTAMP AT TIME ZONE 'UTC' + interval '11 days'),
            8453);
INSERT INTO public.distribution_verification_values(
    type,
    fixed_value,
    bips_value,
    distribution_id)
VALUES (
    'tag_referral',
    0,
    500,(
        SELECT
            id
        FROM distributions
        WHERE
            number = 123));
INSERT INTO public.distribution_verification_values(
    type,
    fixed_value,
    bips_value,
    distribution_id)
VALUES (
    'tag_registration',
    10000,
    0,
(
        SELECT
            id
        FROM
            distributions
        WHERE
            number = 123));
INSERT INTO public.distribution_verification_values(
    type,
    fixed_value,
    bips_value,
    multiplier_max,
    multiplier_step,
    distribution_id)
VALUES (
    'total_tag_referrals' ::public.verification_type,
    0,
    0,
    2.0,
    0.02,
(
        SELECT
            id
        FROM
            distributions
        WHERE
            "number" = 123
        LIMIT 1));
INSERT INTO public.distribution_verification_values(
    type,
    fixed_value,
    bips_value,
    distribution_id)
VALUES (
    'send_streak',
    0,
    500,(
        SELECT
            id
        FROM distributions
        WHERE
            number = 123));
INSERT INTO public.distribution_verification_values(
    type,
    fixed_value,
    bips_value,
    distribution_id)
VALUES (
    'send_ten',
    0,
    500,(
        SELECT
            id
        FROM distributions
        WHERE
            number = 123));
SELECT
    results_eq('SELECT COUNT(*)::integer FROM distributions WHERE number = 123', $$
    VALUES (1) $$, 'Service role should be able to create distributions');
SELECT
    tests.clear_authentication();
SELECT
    is_empty('SELECT * FROM distributions WHERE number = 123', 'Anon cannot read the distributions.');
SELECT
    throws_ok($$ INSERT INTO distributions(
            number, name, description, amount, hodler_pool_bips, bonus_pool_bips, fixed_pool_bips, qualification_start, qualification_end, claim_end, chain_id)
        VALUES (
            1234, 'distribution #1234', 'Description', 100000, 1000000, 1000000, 1000000, '2023-01-01T00:00:00.000Z', '2023-01-31T00:00:00.000Z', '2023-02-28T00:00:00.000Z', 8453);
$$,
'new row violates row-level security policy for table "distributions"',
'Only the service role can insert records.');
SELECT
    tests.authenticate_as('bob');
SELECT
    throws_ok($$ INSERT INTO distributions(
            number, name, description, amount, hodler_pool_bips, bonus_pool_bips, fixed_pool_bips, qualification_start, qualification_end, claim_end, chain_id)
        VALUES (
            1234, 'distribution #1234', 'Description', 100000, 1000000, 1000000, 1000000, '2023-01-01T00:00:00.000Z', '2023-01-31T00:00:00.000Z', '2023-02-28T00:00:00.000Z', 8453);
$$,
'new row violates row-level security policy for table "distributions"',
'Only the service role can insert records.');
SELECT
    isnt_empty('SELECT * FROM distribution_verification_values WHERE distribution_id = (SELECT id FROM distributions WHERE number = 123)', 'Any other role can read the distribution_verification_values.');
SELECT
    tests.clear_authentication();
SELECT
    throws_ok($$ INSERT INTO distribution_verification_values(
            distribution_id, type, fixed_value, bips_value)
        VALUES ((
            SELECT
                id
            FROM distributions
            WHERE
                number = 123), 'tag_referral', 100000, 100000);
$$,
'new row violates row-level security policy for table "distribution_verification_values"',
'Only the service role can insert records.');
SELECT
    is_empty('SELECT * FROM distribution_verification_values WHERE distribution_id = (
    SELECT id
    FROM distributions
    WHERE number = 123
)', 'Any other role can read the distribution_verification_values.');
SELECT
    tests.authenticate_as('bob');
SELECT
    throws_ok($$ INSERT INTO distribution_verification_values(
            distribution_id, type, fixed_value, bips_value)
        VALUES ((
            SELECT
                id
            FROM distributions
            WHERE
                number = 123), 'tag_referral', 100000, 100000);
$$,
'new row violates row-level security policy for table "distribution_verification_values"',
'Only the service role can insert records.');
-- only service role can update distribution shares
SELECT
    throws_ok($$
        SELECT
            "public"."update_distribution_shares"((
                SELECT
                    id
                FROM distributions
                WHERE
                    number = 123), ARRAY[(NULL,(
                    SELECT
                        id
                    FROM distributions
                    WHERE
                        number = 123), tests.get_supabase_uid('bob'), '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f', 1000, 500, 200, 300, NOW(), NOW(), 1, 950)::distribution_shares,(NULL,(
            SELECT
                id
            FROM distributions
            WHERE
                number = 123), tests.get_supabase_uid('alice'), '0xaB00d9CDA6DaD99994849d7C66Fa2631f280F64f', 1000, 500, 200, 300, NOW(), NOW(), 1, 950)::distribution_shares]);
$$,
'permission denied for function update_distribution_shares',
'Only the service role can update distribution shares.');
-- verify distribution_shares
SELECT
    set_config('role', 'service_role', TRUE);
SELECT
    "public"."update_distribution_shares"((
        SELECT
            id
        FROM distributions
        WHERE
            number = 123), ARRAY[(NULL,(
            SELECT
                id
            FROM distributions
            WHERE
                number = 123), tests.get_supabase_uid('bob'), '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f', 1000, 500, 200, 300, NOW(), NOW(), 1, 950)::distribution_shares,(NULL,(
        SELECT
            id
        FROM distributions
        WHERE
            number = 123), tests.get_supabase_uid('alice'), '0xaB00d9CDA6DaD99994849d7C66Fa2631f280F64f', 1000, 500, 200, 300, NOW(), NOW(), 1, 950)::distribution_shares]);
-- Check insert by service_role
SELECT
    results_eq('SELECT COUNT(*)::integer FROM distribution_shares WHERE distribution_id = (
    SELECT id
    FROM distributions
    WHERE number = 123
)', $$
    VALUES (2) $$, 'Service role should be able to create distribution shares');
-- Check read access for other roles
SELECT
    tests.clear_authentication();
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM distribution_shares
            WHERE
                distribution_id =(
                    SELECT
                        id
                    FROM distributions
                    WHERE
                        number = 123) $$, $$
            VALUES (0) $$, 'Anonymous role should not be able to read distribution shares');
-- Check read access for the bob
SELECT
    tests.authenticate_as('bob');
SELECT
    results_eq('SELECT COUNT(*)::integer FROM distribution_shares', $$
    VALUES (1) $$, 'Authenticated user should be able to read their own shares');
-- Check insert violation by other roles
SELECT
    throws_ok($$ INSERT INTO distribution_shares(
            distribution_id, user_id, address, amount, hodler_pool_amount, bonus_pool_amount, fixed_pool_amount)
        VALUES ((
            SELECT
                id
            FROM distributions
            WHERE
                number = 123), tests.get_supabase_uid('bob'), '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f', 100000, 10000, 5000, 2000);
$$,
'new row violates row-level security policy for table "distribution_shares"',
'Only the service role can insert records.');
-- Test for tag_registration verification
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'tag_registration' $$, $$
            VALUES (0) $$, 'Verification for tag registration should be empty when no tags are confirmed');
-- Confirm tags with the service role
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
INSERT INTO sendtag_checkout_receipts(
    chain_id,
    log_addr,
    tx_hash,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    block_time,
    abi_idx,
    sender,
    amount,
    referrer,
    reward)
VALUES (
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    'sendtag_checkout_receipts',
    'sendtag_checkout_receipts',
    1,
    0,
    0,
    1234567890,
    0,
    '\xB0B0000000000000000000000000000000000000', -- Fixed: Changed to match Bob's address case
    1,
    '\x0000000000000000000000000000000000000000',
    0);
SELECT
    confirm_tags( -- bob confirms tags
        '{bob}',(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = '\xB0B0000000000000000000000000000000000000'), NULL);
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'tag_registration' $$, $$
            VALUES (1) $$, 'Verification for tag registration should be inserted');
-- Test for tag_referral and total_tag_referrals verifications
SELECT
    tests.create_supabase_user('alice');
SELECT
    tests.authenticate_as('alice');
-- can create a free common tag without receipt
INSERT INTO tags(
    name,
    user_id)
VALUES (
    'alice',
    tests.get_supabase_uid(
        'alice'));
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'tag_referral' $$, $$
            VALUES (0) $$, 'Verification for user referral should not be inserted');
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'total_tag_referrals' $$, $$
            VALUES (0) $$, 'Verification for total tag referral should not be inserted');
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
INSERT INTO sendtag_checkout_receipts(
    chain_id,
    log_addr,
    tx_hash,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    block_time,
    abi_idx,
    sender,
    amount,
    referrer,
    reward)
VALUES (
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    'sendtag_checkout_receipts',
    'sendtag_checkout_receipts',
    2,
    0,
    0,
    1234567890,
    0,
    '\xa71ce00000000000000000000000000000000000',
    1,
    '\x0000000000000000000000000000000000000000',
    0);
SELECT
    confirm_tags('{alice}',(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = '\xa71ce00000000000000000000000000000000000'),(
            SELECT
                referral_code
            FROM public.profiles
            WHERE
                id = tests.get_supabase_uid('bob')));
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'tag_referral' $$, $$
            VALUES (1) $$, 'Verification for user referral should be inserted');
SELECT
    results_eq($$
        SELECT
            (weight)::integer FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'total_tag_referrals' $$, $$
            VALUES (1) $$, 'Verification for total tag referral should be inserted');
-- Test streak verification
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'send_streak' $$, $$
            VALUES (0) $$, 'No streak verification should exist initially');
-- Test send_ten verification
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'send_ten' $$, $$
            VALUES (0) $$, 'No send ten verification should exist initially');
-- Insert 3-day streak transfers (with unique recipients)
INSERT INTO send_account_transfers(
    f,
    t,
    block_time,
    chain_id,
    tx_hash,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx,
    v,
    log_addr)
VALUES (
    '\xB0B0000000000000000000000000000000000000' ::bytea,
    '\xa71ce00000000000000000000000000000000000' ::bytea,
    EXTRACT(
        EPOCH FROM ((
            SELECT
                qualification_start
            FROM distributions
            WHERE
                number = 123) + interval '1 hour')),
    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901236'::bytea,
    'send_account_transfers',
    'send_account_transfers',
    1,
    0,
    0,
    0,
    1000000000000000000,
    '\x5afe000000000000000000000000000000000000'::bytea),
('\xB0B0000000000000000000000000000000000000'::bytea,
    '\xa71ce00000000000000000000000000000000001'::bytea,
    EXTRACT(EPOCH FROM ((
            SELECT
                qualification_start
            FROM distributions
            WHERE
                number = 123) + interval '25 hours')),
    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901237'::bytea,
    'send_account_transfers',
    'send_account_transfers',
    2,
    0,
    0,
    0,
    1000000000000000000,
    '\x5afe000000000000000000000000000000000000'::bytea),
('\xB0B0000000000000000000000000000000000000'::bytea,
    '\xa71ce00000000000000000000000000000000002'::bytea,
    EXTRACT(EPOCH FROM ((
            SELECT
                qualification_start
            FROM distributions
            WHERE
                number = 123) + interval '49 hours')),
    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901238'::bytea,
    'send_account_transfers',
    'send_account_transfers',
    3,
    0,
    0,
    0,
    1000000000000000000,
    '\x5afe000000000000000000000000000000000000'::bytea);
SELECT
    results_eq($$
        SELECT
            weight::integer FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'send_streak' $$, $$
            VALUES (3) $$, 'Streak verification should show 3-day streak');
-- Insert broken streak transfer (with unique recipient)
INSERT INTO send_account_transfers(
    f,
    t,
    block_time,
    chain_id,
    tx_hash,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx,
    v,
    log_addr)
VALUES (
    '\xB0B0000000000000000000000000000000000000' ::bytea,
    '\xa71ce00000000000000000000000000000000003' ::bytea,
    EXTRACT(
        EPOCH FROM ((
            SELECT
                qualification_start
            FROM distributions
            WHERE
                number = 123) + interval '120 hours')),
    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901239'::bytea,
    'send_account_transfers',
    'send_account_transfers',
    4,
    0,
    0,
    0,
    1000000000000000000,
    '\x5afe000000000000000000000000000000000000'::bytea);
SELECT
    results_eq($$
        SELECT
            weight::integer FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'send_streak' $$, $$
            VALUES (3) $$, 'Broken send streak should not increase it');
-- Insert same-day transfers
INSERT INTO send_account_transfers(
    f,
    t,
    block_time,
    chain_id,
    tx_hash,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx,
    v,
    log_addr)
VALUES (
    '\xB0B0000000000000000000000000000000000000' ::bytea,
    '\xa71ce00000000000000000000000000000000004' ::bytea,
    EXTRACT(
        EPOCH FROM ((
            SELECT
                qualification_start
            FROM distributions
            WHERE
                number = 123) + interval '1 hour')),
    8453,
    '\x123456789012345678901234567890123456789012345678901234567890123a'::bytea,
    'send_account_transfers',
    'send_account_transfers',
    5,
    0,
    0,
    0,
    1000000000000000000,
    '\x5afe000000000000000000000000000000000000'::bytea),
('\xB0B0000000000000000000000000000000000000'::bytea,
    '\xa71ce00000000000000000000000000000000005'::bytea,
    EXTRACT(EPOCH FROM ((
            SELECT
                qualification_start
            FROM distributions
            WHERE
                number = 123) + interval '1 hour')),
    8453,
    '\x123456789012345678901234567890123456789012345678901234567890123b'::bytea,
    'send_account_transfers',
    'send_account_transfers',
    6,
    1,
    0,
    0,
    1000000000000000000,
    '\x5afe000000000000000000000000000000000000'::bytea);
SELECT
    results_eq($$
        SELECT
            weight::integer FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'send_streak' $$, $$
            VALUES (3) $$, 'Multiple transfers to different recipients in same day should not increase streak');
-- Insert set of transfers - one with send account, one without, one with same send account
INSERT INTO send_account_transfers(
    f,
    t,
    block_time,
    chain_id,
    tx_hash,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx,
    v,
    log_addr)
VALUES (
    '\xB0B0000000000000000000000000000000000000' ::bytea,
    '\xa71ce00000000000000000000000000000000006' ::bytea,
    EXTRACT(
        EPOCH FROM ((
            SELECT
                qualification_start
            FROM distributions
            WHERE
                number = 123) + interval '1 hour')),
    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901234'::bytea,
    'send_account_transfers',
    'send_account_transfers',
    7,
    0,
    0,
    0,
    1000000000000000000,
    '\x5afe000000000000000000000000000000000000'::bytea),
('\xB0B0000000000000000000000000000000000000'::bytea,
    '\xa71ce00000000000000000000000000000000069'::bytea,
    EXTRACT(EPOCH FROM ((
            SELECT
                qualification_start
            FROM distributions
            WHERE
                number = 123) + interval '1 hour')),
    8453,
    '\x123456789012345678901234567890123456789012345678901234567890123a'::bytea,
    'send_account_transfers',
    'send_account_transfers',
    8,
    0,
    0,
    0,
    1000000000000000000,
    '\x5afe000000000000000000000000000000000000'::bytea),
('\xB0B0000000000000000000000000000000000000'::bytea,
    '\xa71ce00000000000000000000000000000000006'::bytea,
    EXTRACT(EPOCH FROM ((
            SELECT
                qualification_start
            FROM distributions
            WHERE
                number = 123) + interval '1 hour')),
    8453,
    '\x1234567890123456789012345678901234567890123456789012345678901234'::bytea,
    'send_account_transfers',
    'send_account_transfers',
    9,
    0,
    0,
    0,
    1000000000000000000,
    '\x5afe000000000000000000000000000000000000'::bytea);
SELECT
    results_eq($$
        SELECT
            metadata ->> 'value' FROM distribution_verifications
            WHERE
                user_id = tests.get_supabase_uid('bob')
                AND type = 'send_ten' $$, $$
            VALUES ('8') $$, 'Should only count the recipient with a send account');
SELECT
    finish();
ROLLBACK;

RESET client_min_messages;

