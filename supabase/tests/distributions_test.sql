BEGIN;

SELECT plan(18);

CREATE EXTENSION "basejump-supabase_test_helpers";

GRANT USAGE ON SCHEMA tests TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO service_role;

set role to service_role;

-- create test data
SELECT tests.create_supabase_user('hodler');

SELECT tests.create_supabase_user('anotha_hodler');

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
VALUES(
        123,
        'distribution #123',
        'Description',
        100000,
        1000000,
        1000000,
        1000000,
        (
            select now() - interval '1 day'
        ),
        (
            select now() + interval '1 day'
        ),
        1e6::bigint,
        (
            select now() + interval '2 day'
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

set role to anon;

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

select tests.authenticate_as('hodler');

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

set role to anon;

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

select tests.authenticate_as('hodler');

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
                    tests.get_supabase_uid('hodler'),
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
                    tests.get_supabase_uid('anotha_hodler'),
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

select tests.clear_authentication();

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
                    tests.get_supabase_uid('hodler'),
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
                    tests.get_supabase_uid('anotha_hodler'),
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
set role to service_role;

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
            tests.get_supabase_uid('hodler'),
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
            tests.get_supabase_uid('anotha_hodler'),
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
set role to anon;

SELECT results_eq(
        'SELECT COUNT(*)::integer FROM distribution_shares WHERE distribution_id = (
    SELECT id
    FROM distributions
    WHERE number = 123
)',
        $$VALUES (0) $$,
        'Anonymous role should not be able to read distribution shares'
    );

-- Check read access for the hodler
SELECT tests.authenticate_as('hodler');

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
                tests.get_supabase_uid('hodler'),
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
INSERT INTO tags (user_id, name)
VALUES (
        tests.get_supabase_uid('hodler'),
        'test_tag'
    );

SELECT results_eq(
        $$SELECT COUNT(*)::integer
        FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('hodler')
            AND type = 'tag_registration' $$,
            $$VALUES (0) $$,
            'Verification for tag registration should be inserted'
    );

select tests.clear_authentication();

set role to service_role;

SELECT confirm_tags(
        '{test_tag}',
        '0x1234567890123456789012345678901234567890123456789012345678901234',
        null
    );

SELECT results_eq(
        $$SELECT COUNT(*)::integer
        FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('hodler')
            AND type = 'tag_registration' $$,
            $$VALUES (1) $$,
            'Verification for tag registration should be inserted'
    );

-- Test for tag_referral verification
SELECT tests.create_supabase_user('tag_creator_2');

SELECT tests.authenticate_as('tag_creator_2');

-- can create a free common tag without receipt
INSERT INTO tags(name, user_id)
VALUES (
        'tag_creator_2',
        tests.get_supabase_uid('tag_creator_2')
    );

SELECT results_eq(
        $$SELECT COUNT(*)::integer
        FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('hodler')
            AND type = 'tag_referral' $$,
            $$VALUES (0) $$,
            'Verification for user referral should be inserted'
    );

select tests.clear_authentication();

set role to service_role;

select confirm_tags(
        '{tag_creator_2}',
        '0x3234567890123456789012345678901234567890123456789012345678901234',
        (
            select referral_code
            from public.profiles
            where id = tests.get_supabase_uid('hodler')
        )
    );

SELECT results_eq(
        $$SELECT COUNT(*)::integer
        FROM distribution_verifications
        WHERE user_id = tests.get_supabase_uid('hodler')
            AND type = 'tag_referral' $$,
            $$VALUES (1) $$,
            'Verification for user referral should be inserted'
    );

SELECT FINISH();

ROLLBACK;
