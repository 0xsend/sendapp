begin;

select plan(5);

create extension "basejump-supabase_test_helpers";

grant usage on schema tests to service_role;

grant execute on all functions in schema tests to service_role;

\set hodler_address '\'f39Fd6e51aad88F6F4ce6aB8827279cffFb92266\''

-- 1. Test when provided distribution_id does not exist
select throws_ok($$SELECT *
        FROM distribution_hodler_addresses(999999) $$, 'Distribution not found.',
                 'Should raise exception if distribution does not exist');

select tests.create_supabase_user('hodler');

-- create a liquidity pool
insert into send_liquidity_pools (address, chain_id) 
values (decode('a1b2457c0b627f97f6cc892946a382451e979014', 'hex'), 8453);

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
        '2023-01-01T00:00:00.000Z',
        '2023-01-31T00:00:00.000Z',
        1e6::bigint,
        '2023-02-28T00:00:00.000Z',
        8453
    );

-- 2. Test when there are eligible hodler addresses
insert into public.send_token_transfers ("f",
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
values ((select address from send_liquidity_pools limit 1),
        decode(:hodler_address, 'hex'),
        1000000,
        'send_token_transfers',
        'send_token_transfers',
        18181005,
        extract(epoch from '2023-01-21 01:32:59.000000 +00:00'::timestamp),
        1,
        158,
        8453,
        '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '\x1234',
        0);

insert into chain_addresses (address, user_id)
values (concat('0x', :hodler_address),
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

insert into public.send_token_transfers ("f",
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
values (decode(:hodler_address, 'hex'),
        (select address from send_liquidity_pools limit 1),
        64509,
        'send_token_transfers',
        'send_token_transfers',
        18180534,
        extract(epoch from '2023-01-20 23:58:35.000000 +00:00'::timestamp),
        1,
        182,
        8453,
        '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        '\x1234',
        0);

select is_empty($$SELECT *
        FROM distribution_hodler_addresses((select id from distributions where number = 123)) $$,
           -- empty result
                'Should return empty result when the distribution exists but user has sold');

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
