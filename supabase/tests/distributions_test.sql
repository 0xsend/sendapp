SET client_min_messages TO NOTICE;

BEGIN;
SELECT
    plan(37);
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
-- Creating a tag for test user using create_tag function
SELECT create_tag('bob', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('bob')));
-- Confirm tags with the service role
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);

DELETE FROM distributions
WHERE qualification_start <= (now() AT TIME ZONE 'UTC')
AND qualification_end >= (now() AT TIME ZONE 'UTC');

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
    -- start now
    (
        SELECT
            CURRENT_TIMESTAMP AT TIME ZONE 'UTC'),
(
        SELECT
            CURRENT_TIMESTAMP AT TIME ZONE 'UTC' + interval '10 days'),
        1e6::bigint,
(
            SELECT
                CURRENT_TIMESTAMP AT TIME ZONE 'UTC' + interval '11 days'),
            8453);

-- Add send slash settings for current distribution
-- 10 send with divisor of 1 means send ceiling is hodler_min_balancec/10 = 1e5
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
(
        SELECT
            id
        FROM
            distributions
        WHERE
            number = 123), multiplier_min, multiplier_max, multiplier_step
FROM
    distribution_verification_values
WHERE
    distribution_id =(
        SELECT
            id
        FROM
            distributions
        WHERE
            number <> 123
        ORDER BY
            number DESC
        LIMIT 1)
    AND type NOT IN (
        SELECT
            type
        FROM
            distribution_verification_values
        WHERE
            distribution_id =(
                SELECT
                    id
                FROM
                    distributions
                WHERE
                    number = 123));

-- Test sendpot_ticket_purchase verification trigger
-- Add verification value for sendpot_ticket_purchase
INSERT INTO public.distribution_verification_values(
    type,
    fixed_value,
    bips_value,
    multiplier_min,
    multiplier_max,
    multiplier_step,
    distribution_id)
VALUES (
    'sendpot_ticket_purchase',
    3000000000000000000,
    0,
    1.0,
    1.0,
    0.0,
    (SELECT id FROM distributions WHERE number = 123));

SELECT
    results_eq($$
        SELECT COUNT(*)::integer FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
        AND type = 'sendpot_ticket_purchase' $$, $$
        VALUES (0) $$,
        'No sendpot ticket purchase verification should exist initially');

SELECT
    results_eq('SELECT COUNT(*)::integer FROM distributions WHERE number = 123', $$
    VALUES (1) $$, 'Service role should be able to create distributions');
SELECT
    tests.clear_authentication();
SELECT
    throws_ok($$ INSERT INTO distributions(
            number, tranche_id, name, description, amount, hodler_pool_bips, bonus_pool_bips, fixed_pool_bips, qualification_start, qualification_end, claim_end, chain_id)
        VALUES (
            1234, 1234, 'distribution #1234', 'Description', 100000, 1000000, 1000000, 1000000, '2023-01-01T00:00:00.000Z', '2023-01-31T00:00:00.000Z', '2023-02-28T00:00:00.000Z', 8453);
$$,
'new row violates row-level security policy for table "distributions"',
'Only the service role can insert records.');
SELECT
    tests.authenticate_as('bob');
SELECT
    throws_ok($$ INSERT INTO distributions(
            number, tranche_id, name, description, amount, hodler_pool_bips, bonus_pool_bips, fixed_pool_bips, qualification_start, qualification_end, claim_end, chain_id)
        VALUES (
            1234, 1234, 'distribution #1234', 'Description', 100000, 1000000, 1000000, 1000000, '2023-01-01T00:00:00.000Z', '2023-01-31T00:00:00.000Z', '2023-02-28T00:00:00.000Z', 8453);
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
                        number = 123), tests.get_supabase_uid('bob'), '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f', 950, 500, 200, 300, NOW(), NOW(), 1)::distribution_shares,(NULL,(
            SELECT
                id
            FROM distributions
            WHERE
                number = 123), tests.get_supabase_uid('alice'), '0xaB00d9CDA6DaD99994849d7C66Fa2631f280F64f', 950, 500, 200, 300, NOW(), NOW(), 1)::distribution_shares]);
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
                number = 123), tests.get_supabase_uid('bob'), '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f', 950, 500, 200, 300, NOW(), NOW(), 1)::distribution_shares,(NULL,(
        SELECT
            id
        FROM distributions
        WHERE
            number = 123), tests.get_supabase_uid('alice'), '0xaB00d9CDA6DaD99994849d7C66Fa2631f280F64f', 950, 500, 200, 300, NOW(), NOW(), 1)::distribution_shares]);
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
        '{bob}'::citext[],
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('bob')),
        (
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = '\xB0B0000000000000000000000000000000000000'),
        NULL);
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
SELECT create_tag('alice', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('alice')));
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
    confirm_tags('{alice}'::citext[], (
            SELECT id FROM send_accounts
            WHERE user_id = tests.get_supabase_uid('alice')
        ), (
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = '\xa71ce00000000000000000000000000000000000'), (
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
    is_empty($$
        SELECT 1 FROM distribution_verifications
        WHERE
            user_id = tests.get_supabase_uid('bob')
            AND type = 'total_tag_referrals' $$, 'Verification for total tag referral should still not be inserted');
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
INSERT INTO send_token_transfers(
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
    'send_token_transfers',
    'send_token_transfers',
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
    'send_token_transfers',
    'send_token_transfers',
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
    'send_token_transfers',
    'send_token_transfers',
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
INSERT INTO send_token_transfers(
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
    'send_token_transfers',
    'send_token_transfers',
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
INSERT INTO send_token_transfers(
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
    'send_token_transfers',
    'send_token_transfers',
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
    'send_token_transfers',
    'send_token_transfers',
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
INSERT INTO send_token_transfers(
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
    'send_token_transfers',
    'send_token_transfers',
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
    'send_token_transfers',
    'send_token_transfers',
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
    'send_token_transfers',
    'send_token_transfers',
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
                AND distribution_id = (SELECT id FROM distributions WHERE number = 123)
                AND type = 'send_ten' $$, $$
            VALUES ('8') $$, 'Should only count the recipients with a send account');

-- Test update_referral_verifications function
SELECT
    results_eq($$
        SELECT COUNT(*) FROM distribution_verifications
        WHERE distribution_id = (SELECT id FROM distributions WHERE number = 123)
        AND type = 'total_tag_referrals'
    $$,
    ARRAY[0]::bigint[],
    'Should start with no total_tag_referrals verifications'
);

-- Setup referrals
INSERT INTO referrals (referrer_id, referred_id)
VALUES
    (tests.get_supabase_uid('bob'), tests.get_supabase_uid('recipient1')),
    (tests.get_supabase_uid('bob'), tests.get_supabase_uid('recipient2')),
    (tests.get_supabase_uid('bob'), tests.get_supabase_uid('recipient3'));

-- Call the function
SELECT update_referral_verifications(
    (SELECT id FROM distributions WHERE number = 123),
    ARRAY[
        ROW(
            NULL,
            (SELECT id FROM distributions WHERE number = 123),
            tests.get_supabase_uid('recipient1'),
            '\xa71ce00000000000000000000000000000000001'::bytea,
            950, 500, 200, 300,
            CURRENT_TIMESTAMP::timestamp with time zone,
            CURRENT_TIMESTAMP::timestamp with time zone,
            1
        )::distribution_shares,
        ROW(
            NULL,
            (SELECT id FROM distributions WHERE number = 123),
            tests.get_supabase_uid('recipient2'),
            '\xa71ce00000000000000000000000000000000002'::bytea,
            950, 500, 200, 300,
            CURRENT_TIMESTAMP::timestamp with time zone,
            CURRENT_TIMESTAMP::timestamp with time zone,
            2
        )::distribution_shares,
        ROW(
            NULL,
            (SELECT id FROM distributions WHERE number = 123),
            tests.get_supabase_uid('recipient3'),
            '\xa71ce00000000000000000000000000000000003'::bytea,
            950, 500, 200, 300,
            CURRENT_TIMESTAMP::timestamp with time zone,
            CURRENT_TIMESTAMP::timestamp with time zone,
            3
        )::distribution_shares
    ]
);

-- Test total_tag_referrals
SELECT results_eq(
    $$
    SELECT COUNT(*) FROM distribution_verifications
    WHERE distribution_id = (SELECT id FROM distributions WHERE number = 123)
    AND user_id = tests.get_supabase_uid('bob')
    AND type = 'total_tag_referrals'
    $$,
    ARRAY[1]::bigint[],
    'Should have exactly one total_tag_referrals record'
);

-- Test tag_referral records
SELECT results_eq(
    $$
    SELECT COUNT(*) FROM distribution_verifications
    WHERE distribution_id = (SELECT id FROM distributions WHERE number = 123)
    AND user_id = tests.get_supabase_uid('bob')
    AND type = 'tag_referral'
    AND weight = 1
    $$,
    ARRAY[3]::bigint[],
    'Should have three tag_referral records with weight = 1(one for each referred user in distribution shares)'
);

-- Test tag_referral weights
SELECT results_eq(
    $$
    SELECT weight FROM distribution_verifications
    WHERE distribution_id = (SELECT id FROM distributions WHERE number = 123)
    AND user_id = tests.get_supabase_uid('bob')
    AND type = 'tag_referral'
    ORDER BY weight
    $$,
    ARRAY[0, 1, 1, 1]::numeric[],
    'All tag_referral records with distribution shares should have weight = 1'
);

-- Insert ticket purchase before any jackpot (should create verification)
INSERT INTO sendpot_user_ticket_purchases(
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    buyer,
    recipient,
    tickets_purchased_total_bps,
    value,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx)
VALUES (
    8453,
    '\x5afe000000000000000000000000000000000000',
    EXTRACT(EPOCH FROM ((
        SELECT qualification_start FROM distributions WHERE number = 123) + interval '1 hour')),
    '\xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    '\xB0B0000000000000000000000000000000000000',
    '\xB0B0000000000000000000000000000000000000',
    70000,  -- 10 tickets worth of BPS (10 * 7000)
    1000000000000000000,
    'sendpot_user_ticket_purchases',
    'sendpot_user_ticket_purchases',
    100,
    0,
    0,
    0);

SELECT
    results_eq($$
        SELECT COUNT(*)::integer FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
        AND type = 'sendpot_ticket_purchase' $$, $$
        VALUES (1) $$,
        'Should create verification for first ticket purchase');

SELECT
    results_eq($$
        SELECT weight::integer FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
        AND type = 'sendpot_ticket_purchase' $$, $$
        VALUES (1) $$,
        'Weight should be 1 (10 tickets / 10 increment)');

-- Insert another ticket purchase in same period (should update existing verification)
INSERT INTO sendpot_user_ticket_purchases(
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    buyer,
    recipient,
    tickets_purchased_total_bps,
    value,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx)
VALUES (
    8453,
    '\x5afe000000000000000000000000000000000000',
    EXTRACT(EPOCH FROM ((
        SELECT qualification_start FROM distributions WHERE number = 123) + interval '2 hours')),
    '\xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    '\xB0B0000000000000000000000000000000000000',
    '\xB0B0000000000000000000000000000000000000',
    35000,  -- 5 tickets worth of BPS (5 * 7000)
    500000000000000000,
    'sendpot_user_ticket_purchases',
    'sendpot_user_ticket_purchases',
    101,
    0,
    0,
    0);

SELECT
    results_eq($$
        SELECT COUNT(*)::integer FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
        AND type = 'sendpot_ticket_purchase' $$, $$
        VALUES (1) $$,
        'Should still have only one verification (updated, not inserted)');

SELECT
    results_eq($$
        SELECT weight::integer FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
        AND type = 'sendpot_ticket_purchase' $$, $$
        VALUES (1) $$,
        'Weight should be 1 (15 tickets / 10 increment = floor(1.5) = 1)');

-- Insert a jackpot run
INSERT INTO sendpot_jackpot_runs(
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    win_amount,
    winner,
    winning_ticket,
    tickets_purchased_total_bps,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx)
VALUES (
    8453,
    '\x5afe000000000000000000000000000000000000',
    EXTRACT(EPOCH FROM ((
        SELECT qualification_start FROM distributions WHERE number = 123) + interval '3 hours')),
    '\xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    5000000000000000000,
    '\xB0B0000000000000000000000000000000000000',
    50,
    150,
    'sendpot_jackpot_runs',
    'sendpot_jackpot_runs',
    102,
    0,
    0,
    0);

-- Insert ticket purchase after jackpot (should create NEW verification for new period)
INSERT INTO sendpot_user_ticket_purchases(
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    buyer,
    recipient,
    tickets_purchased_total_bps,
    value,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx)
VALUES (
    8453,
    '\x5afe000000000000000000000000000000000000',
    EXTRACT(EPOCH FROM ((
        SELECT qualification_start FROM distributions WHERE number = 123) + interval '4 hours')),
    '\xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd',
    '\xB0B0000000000000000000000000000000000000',
    '\xB0B0000000000000000000000000000000000000',
    140000,  -- 20 tickets worth of BPS (20 * 7000)
    2000000000000000000,
    'sendpot_user_ticket_purchases',
    'sendpot_user_ticket_purchases',
    103,
    0,
    0,
    0);

SELECT
    results_eq($$
        SELECT COUNT(*)::integer FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
        AND type = 'sendpot_ticket_purchase' $$, $$
        VALUES (2) $$,
        'Should create new verification for new jackpot period');

SELECT
    results_eq($$
        SELECT weight::integer FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
        AND type = 'sendpot_ticket_purchase'
        ORDER BY created_at DESC
        LIMIT 1 $$, $$
        VALUES (2) $$,
        'New period verification should have weight of 2 (20 tickets / 10 increment)');

-- Insert another ticket purchase in the new period (should update the latest verification)
INSERT INTO sendpot_user_ticket_purchases(
    chain_id,
    log_addr,
    block_time,
    tx_hash,
    buyer,
    recipient,
    tickets_purchased_total_bps,
    value,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx)
VALUES (
    8453,
    '\x5afe000000000000000000000000000000000000',
    EXTRACT(EPOCH FROM ((
        SELECT qualification_start FROM distributions WHERE number = 123) + interval '5 hours')),
    '\xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    '\xB0B0000000000000000000000000000000000000',
    '\xB0B0000000000000000000000000000000000000',
    70000,  -- 10 more tickets worth of BPS (10 * 7000)
    750000000000000000,
    'sendpot_user_ticket_purchases',
    'sendpot_user_ticket_purchases',
    104,
    0,
    0,
    0);

SELECT
    results_eq($$
        SELECT COUNT(*)::integer FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
        AND type = 'sendpot_ticket_purchase' $$, $$
        VALUES (2) $$,
        'Should still have two verifications (one per jackpot period)');

SELECT
    results_eq($$
        SELECT weight::integer FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
        AND type = 'sendpot_ticket_purchase'
        ORDER BY created_at DESC
        LIMIT 1 $$, $$
        VALUES (3) $$,
        'Latest verification weight should be 3 (30 tickets / 10 increment)');

SELECT finish();
ROLLBACK;

RESET client_min_messages;
