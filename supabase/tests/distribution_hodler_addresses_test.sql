begin;

select plan(5);

create extension "basejump-supabase_test_helpers";

grant usage on schema tests to service_role;

grant execute on all functions in schema tests to service_role;

\set hodler_address '\'0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\''

-- 1. Test when provided distribution_id does not exist
select throws_ok($$SELECT *
        FROM distribution_hodler_addresses(999999) $$, 'Distribution not found.',
                 'Should raise exception if distribution does not exist');

select tests.create_supabase_user('hodler');

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
        claim_end
    )
VALUES(
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
        '2023-02-28T00:00:00.000Z'
    );

-- 2. Test when there are eligible hodler addresses
insert into public.send_transfer_logs ("from",
                                       "to",
                                       "value",
                                       block_number,
                                       block_timestamp,
                                       block_hash,
                                       tx_hash,
                                       log_index,
                                       created_at)
values ('0x14F59C715C205002c6e3F36766D302c1a19bacC8',
        :hodler_address,
        1000000,
        18181005,
        '2023-01-21 01:32:59.000000 +00:00',
        '0x0957503544825b4b2ac6ea69ddf8dc8a30cf4c8bd76a939cef442f6ae0468a78',
        '0x8b735c5a690caed62a642bd18c823dcb236e1af73b94aef481b8c5125447e5eb',
        158,
        '2023-01-22 14:24:49.162268 +00:00');

insert into chain_addresses (address, user_id)
values (:hodler_address,
        tests.get_supabase_uid('hodler'));

insert into distribution_verifications(user_id, distribution_id, type)
values (tests.get_supabase_uid('hodler'),
        (select id from distributions where number = 123),
        'tag_registration');

set role to service_role;

select results_eq($$SELECT
            address,
            user_id
        FROM distribution_hodler_addresses((select id from distributions where number = 123)) $$, $$
            SELECT address, user_id from chain_addresses
            WHERE user_id = tests.get_supabase_uid('hodler')
            $$, 'Should return the eligible hodler addresses');

-- 3. Test paper hands are excluded

insert into public.send_transfer_logs ("from",
                                       "to",
                                       "value",
                                       block_number,
                                       block_timestamp,
                                       block_hash,
                                       tx_hash,
                                       log_index,
                                       created_at)
values (:hodler_address,
        '0x14F59C715C205002c6e3F36766D302c1a19bacC8',
        64509,
        18180534,
        '2023-01-20 23:58:35.000000 +00:00',
        '0xb7b793d5e3aef0883654acf83a8a53129d2ab9b32b25a7f87df10d21d37c065b',
        '0x18d8ca2d1857e9521f2e131b8769c1608092e262d16f0cba8f559df2b2118672',
        182,
        '2023-01-22 14:24:49.162268 +00:00');

select is_empty($$SELECT *
        FROM distribution_hodler_addresses((select id from distributions where number = 123)) $$,
           -- empty result
                'Should return empty result when the distribution exists but no user has sold');

select tests.authenticate_as('hodler');

-- verify only service_role can call this function
select throws_ok($$
        SELECT *
        FROM distribution_hodler_addresses((select id from distributions where number = 123))
        $$,
        'permission denied for function distribution_hodler_addresses',
        'Should raise exception if user is not service_role');

select tests.clear_authentication();

select throws_ok($$
        SELECT *
        FROM distribution_hodler_addresses((select id from distributions where number = 123))
        $$,
        'permission denied for function distribution_hodler_addresses',
        'Should raise exception if user is not authenticated');


select *
from finish();

rollback;
