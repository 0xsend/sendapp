BEGIN;

SELECT plan(18);

CREATE EXTENSION "basejump-supabase_test_helpers";


SELECT set_config('role', 'service_role', true);

-- create test data
SELECT tests.create_supabase_user('bob');
SELECT tests.create_supabase_user('alice');


INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('bob'),
    '0xb0b0000000000000000000000000000000000000', -- matches sender
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
),
(
    tests.get_supabase_uid('alice'),
    '0xa71ce00000000000000000000000000000000000', -- matches sender
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- bob can register and confirm tags with valid receipts
SELECT tests.authenticate_as('bob');

-- Inserting a tag for test user
INSERT INTO tags (name, user_id)
VALUES (
    'bob',
    tests.get_supabase_uid('bob')
);

-- Confirm tags with the service role
SELECT tests.clear_authentication();

SELECT set_config('role', 'service_role', true);

INSERT INTO distributions (
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
    chain_id
)
VALUES (
    123,
    'distribution #123',
    'Description',
    100000,
    1000000,
    1000000,
    1000000,
    (
        SELECT now() - interval '1 day'
    ),
    (
        SELECT now() + interval '1 day'
    ),
    1e6::bigint,
    (
        SELECT now() + interval '2 day'
    ),
    8453
);

INSERT INTO public.distribution_verification_values (
    type,
    fixed_value,
    bips_value,
    distribution_id
)
VALUES (
    'tag_referral',
    0,
    500,
    (
        SELECT id
        FROM distributions
        WHERE number = 123
    )
);

INSERT INTO public.distribution_verification_values (
    type,
    fixed_value,
    bips_value,
    distribution_id
)
VALUES (
    'tag_registration',
    10000,
    0,
    (
        SELECT id
        FROM distributions
        WHERE number = 123
    )
);

SELECT results_eq(
    'SELECT COUNT(*)::integer FROM distributions WHERE number = 123',
    $$VALUES (1) $$,
    'Service role should be able to create distributions'
);

SELECT tests.clear_authentication();

SELECT is_empty(
    'SELECT * FROM distributions WHERE number = 123',
    'Anon cannot read the distributions.'
);

SELECT throws_ok(
    $$
        INSERT INTO distributions (
                number,
                name,
                description,
                amount,
                hodler_pool_bips,
                bonus_pool_bips,
                fixed_pool_bips,
                qualification_start,
                qualification_end,
                claim_end,
                chain_id
            )
        VALUES(
                1234,
                'distribution #1234',
                'Description',
                100000,
                1000000,
                1000000,
                1000000,
                '2023-01-01T00:00:00.000Z',
                '2023-01-31T00:00:00.000Z',
                '2023-02-28T00:00:00.000Z',
                8453
            );

$$,
    'new row violates row-level security policy for table "distributions"',
    'Only the service role can insert records.'
);

SELECT tests.authenticate_as('bob');

SELECT throws_ok(
    $$
        INSERT INTO distributions (
                number,
                name,
                description,
                amount,
                hodler_pool_bips,
                bonus_pool_bips,
                fixed_pool_bips,
                qualification_start,
                qualification_end,
                claim_end,
                chain_id
            )
        VALUES(
                1234,
                'distribution #1234',
                'Description',
                100000,
                1000000,
                1000000,
                1000000,
                '2023-01-01T00:00:00.000Z',
                '2023-01-31T00:00:00.000Z',
                '2023-02-28T00:00:00.000Z',
                8453
            );

$$,
    'new row violates row-level security policy for table "distributions"',
    'Only the service role can insert records.'
);

SELECT isnt_empty(
    'SELECT * FROM distribution_verification_values WHERE distribution_id = (SELECT id FROM distributions WHERE number = 123)',
    'Any other role can read the distribution_verification_values.'
);

SELECT tests.clear_authentication();

SELECT throws_ok(
    $$
        INSERT INTO distribution_verification_values (distribution_id, type, fixed_value, bips_value)
        VALUES(
                (
                    SELECT id
                    FROM distributions
                    WHERE number = 123
                ),
                'tag_referral',
                100000,
                100000
            );

$$,
    'new row violates row-level security policy for table "distribution_verification_values"',
    'Only the service role can insert records.'
);

SELECT is_empty(
    'SELECT * FROM distribution_verification_values WHERE distribution_id = (
    SELECT id
    FROM distributions
    WHERE number = 123
)',
    'Any other role can read the distribution_verification_values.'
);

SELECT tests.authenticate_as('bob');

SELECT throws_ok(
    $$
        INSERT INTO distribution_verification_values (distribution_id, type, fixed_value, bips_value)
        VALUES(
                (
                    SELECT id
                    FROM distributions
                    WHERE number = 123
                ),
                'tag_referral',
                100000,
                100000
            );

$$,
    'new row violates row-level security policy for table "distribution_verification_values"',
    'Only the service role can insert records.'
);

-- only service role can update distribution shares
SELECT throws_ok(
    $$
        select "public"."update_distribution_shares"(
                (
                    SELECT id
                    FROM distributions
                    WHERE number = 123
                ),
                ARRAY [
                (
                    null,
                    (
                        SELECT id
                        FROM distributions
                        WHERE number = 123
                    ),
                    tests.get_supabase_uid('bob'),
                    '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
                    100000,
                    10000,
                    5000,
                    2000,
                    null,
                    null,
                    null
                )::distribution_shares,
                (
                    null,
                    (
                        SELECT id
                        FROM distributions
                        WHERE number = 123
                    ),
                    tests.get_supabase_uid('alice'),
                    '0xaB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
                    100000,
                    10000,
                    5000,
                    2000,
                    null,
                    null,
                    null
                )::distribution_shares
            ]
            );

$$,
    'permission denied for function update_distribution_shares',
    'Only the service role can update distribution shares.'
);

SELECT tests.clear_authentication();

SELECT throws_ok(
    $$
        select "public"."update_distribution_shares"(
                (
                    SELECT id
                    FROM distributions
                    WHERE number = 123
                ),
                ARRAY [
                (
                    null,
                    (
                        SELECT id
                        FROM distributions
                        WHERE number = 123
                    ),
                    tests.get_supabase_uid('bob'),
                    '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
                    100000,
                    10000,
                    5000,
                    2000,
                    null,
                    null,
                    null
                )::distribution_shares,
                (
                    null,
                    (
                        SELECT id
                        FROM distributions
                        WHERE number = 123
                    ),
                    tests.get_supabase_uid('alice'),
                    '0xaB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
                    100000,
                    10000,
                    5000,
                    2000,
                    null,
                    null,
                    null
                )::distribution_shares
            ]
            );

$$,
    'permission denied for function update_distribution_shares',
    'Only the service role can update distribution shares.'
);

-- verify distribution_shares
SELECT set_config('role', 'service_role', true);


select public.update_distribution_shares(
        (
            SELECT id
            FROM distributions
            WHERE number = 123
        ),
        ARRAY[
            (
                null,
                (
                    SELECT id
                    FROM distributions
                    WHERE number = 123
                ),
                tests.get_supabase_uid('bob'),
                '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
                100000,
                10000,
                5000,
                2000,
                null,
                null,
                null
            )::distribution_shares,
            (
                null,
                (
                    SELECT id
                    FROM distributions
                    WHERE number = 123
                ),
                tests.get_supabase_uid('alice'),
                '0xaB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
                100000,
                10000,
                5000,
                2000,
                null,
                null,
                null
            )::distribution_shares
        ]
    );


-- Check insert by service_role
SELECT results_eq(
    'SELECT COUNT(*)::integer FROM distribution_shares WHERE distribution_id = (
    SELECT id
    FROM distributions
    WHERE number = 123
)',
    $$VALUES (2) $$,
    'Service role should be able to create distribution shares'
);

-- Check read access for other roles
SELECT tests.clear_authentication();

SELECT results_eq(
    $$
    SELECT COUNT(*)::integer FROM distribution_shares WHERE distribution_id = (
    SELECT id
    FROM distributions
    WHERE number = 123
    )
    $$,
    $$VALUES (0) $$,
    'Anonymous role should not be able to read distribution shares'
);

-- Check read access for the bob
SELECT tests.authenticate_as('bob');

SELECT results_eq(
    'SELECT COUNT(*)::integer FROM distribution_shares',
    $$VALUES (1) $$,
    'Authenticated user should be able to read their own shares'
);

-- Check insert violation by other roles
SELECT throws_ok(
    $$
        INSERT INTO distribution_shares (
                distribution_id,
                user_id,
                address,
                amount,
                hodler_pool_amount,
                bonus_pool_amount,
                fixed_pool_amount
            )
        VALUES(
                (
                    SELECT id
                    FROM distributions
                    WHERE number = 123
                ),
                tests.get_supabase_uid('bob'),
                '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
                100000,
                10000,
                5000,
                2000
            );

$$,
    'new row violates row-level security policy for table "distribution_shares"',
    'Only the service role can insert records.'
);

-- Test for tag_registration verification

SELECT results_eq(
    $$SELECT COUNT(*)::integer
        FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
            AND type = 'tag_registration' $$,
    $$VALUES (0) $$,
    'Verification for tag registration should be empty when no tags are confirmed'
);

-- Confirm tags with the service role
SELECT tests.clear_authentication();

SELECT set_config('role', 'service_role', true);

INSERT INTO send_account_transfers (
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
    f,
    t,
    v
)
VALUES (
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    'send_account_transfers',
    'send_account_transfers',
    1,
    0,
    0,
    1234567890,
    0,
    '\xb0b0000000000000000000000000000000000000',
    '\x3F14F917FB2DF7E0F3C6B06BB0FA0522FBEA4EEC',
    1
);

SELECT confirm_tags( -- bob confirms tags
    '{bob}',
    (
        SELECT event_id
        FROM send_account_transfers
        WHERE f = '\xb0b0000000000000000000000000000000000000'
    ),
    null
);

SELECT results_eq(
    $$SELECT COUNT(*)::integer
        FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
            AND type = 'tag_registration' $$,
    $$VALUES (1) $$,
    'Verification for tag registration should be inserted'
);

-- Test for tag_referral verification
SELECT tests.create_supabase_user('alice');

SELECT tests.authenticate_as('alice');

-- can create a free common tag without receipt
INSERT INTO tags (name, user_id)
VALUES (
    'alice',
    tests.get_supabase_uid('alice')
);

SELECT results_eq(
    $$SELECT COUNT(*)::integer
        FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
            AND type = 'tag_referral' $$,
    $$VALUES (0) $$,
    'Verification for user referral should be inserted'
);

SELECT tests.clear_authentication();

SELECT set_config('role', 'service_role', true);

INSERT INTO send_account_transfers (
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
    f,
    t,
    v
)
VALUES (
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    'send_account_transfers',
    'send_account_transfers',
    2,
    0,
    0,
    1234567890,
    0,
    '\xa71ce00000000000000000000000000000000000',
    '\x3F14F917FB2DF7E0F3C6B06BB0FA0522FBEA4EEC',
    1
);

SELECT confirm_tags(
    '{alice}',
    (
        SELECT event_id
        FROM send_account_transfers
        WHERE f = '\xa71ce00000000000000000000000000000000000'
    ),
    (
        SELECT referral_code
        FROM public.profiles
        WHERE id = tests.get_supabase_uid('bob')
    )
);

SELECT results_eq(
    $$SELECT COUNT(*)::integer
        FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('bob')
            AND type = 'tag_referral' $$,
    $$VALUES (1) $$,
    'Verification for user referral should be inserted'
);

SELECT finish();

ROLLBACK;
