BEGIN;

SELECT plan(4);
create extension "basejump-supabase_test_helpers";

-- alice and bob are top referral users
select tests.create_supabase_user('alice');
select tests.create_supabase_user('bob');
select tests.create_supabase_user('belle');

-- create send accounts
insert into public.send_accounts (user_id, address, chain_id, init_code)
values (tests.get_supabase_uid('alice'),
        '0xa71ce00000000000000000000000000000000000',
        1,
        '\\x00112233445566778899AABBCCDDEEFF'),
       (tests.get_supabase_uid('bob'),
        '0xb0b0000000000000000000000000000000000000',
        1,
        '\\x00112233445566778899AABBCCDDEEFF'),
       (tests.get_supabase_uid('belle'),
        '0xbe77e00000000000000000000000000000000000',
        1,
        '\\x00112233445566778899AABBCCDDEEFF');

-- create send_account_created
insert into public.send_account_created (chain_id,
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
values (1,
        '\x1234',
        floor(extract(epoch from timestamptz '2024-05-26T13:38:25.000000Z')),
        '\x1234',
        '\x1234',
        '0xa71ce00000000000000000000000000000000000',
        'send_account_created',
        'send_account_created',
        1234,
        0,
        0),
       (1,
        '\x1234',
        floor(extract(epoch from timestamptz '2024-05-26T13:38:25.000000Z')),
        '\x1234',
        '\x1234',
        '0xb0b0000000000000000000000000000000000000',
        'send_account_created',
        'send_account_created',
        1234,
        1,
        0),
        (
            1,
            '\x1234',
            floor(extract(epoch from timestamptz '2024-05-26T13:38:25.000000Z')),
            '\x1234',
            '\x1234',
            '0xbe77e00000000000000000000000000000000000',
            'send_account_created',
            'send_account_created',
            1234,
            2,
            0
        );

insert into public.tags (name, status, user_id)
values ('bob', 'confirmed', tests.get_supabase_uid('bob'));

-- alice refers bob
insert into public.referrals (referrer_id, referred_id, tag)
values (tests.get_supabase_uid('alice'),
        tests.get_supabase_uid('bob'),
        'bob');

-- bob creates a sendtag_checkout_receipts rewards alice
insert into public.sendtag_checkout_receipts ("chain_id",
                                              "log_addr",
                                              "block_time",
                                              "tx_hash",
                                              "sender",
                                              "amount",
                                              "referrer",
                                              "reward",
                                              "ig_name",
                                              "src_name",
                                              "block_num",
                                              "tx_idx",
                                              "log_idx",
                                              "abi_idx")
values (1,
        '\x1234',
        floor(extract(epoch from timestamptz '2024-05-26T13:38:25.000000Z')),
        '\x1234',
        '\xb0b0000000000000000000000000000000000000',
        100,
        '\xa71ce00000000000000000000000000000000000',
        100,
        'sendtag_checkout_receipts',
        'sendtag_checkout_receipts',
        1234,
        0,
        0,
        0);

-- alice is at the top of the leaderboard
select tests.authenticate_as('alice');

select results_eq(
    $$
        select ("user").id, referrals::int, rewards_usdc::int, referrals_rank::int, rewards_usdc_rank::int
        from public.leaderboard_referrals_all_time()
        where ("user").id = tests.get_supabase_uid('alice')
        limit 1
    $$,
    $$
        values (
            tests.get_supabase_uid('alice'),
            1,
            100,
            1,
            1
        )
    $$,
    'alice is at the top of the leaderboard'
);

-- bob is not on the leaderboard
select is_empty(
    $$
        select *
        from public.leaderboard_referrals_all_time()
        where ("user").id = tests.get_supabase_uid('bob')
        order by referrals desc
        limit 1
    $$,
    'bob is at the second position'
);

select tests.authenticate_as_service_role();

-- bob refers belle
insert into public.tags (name, status, user_id)
values ('belle', 'confirmed', tests.get_supabase_uid('belle'));

-- belle creates a sendtag_checkout_receipts rewards bob
insert into public.sendtag_checkout_receipts ("chain_id",
                                              "log_addr",
                                              "block_time",
                                              "tx_hash",
                                              "sender",
                                              "amount",
                                              "referrer",
                                              "reward",
                                              "ig_name",
                                              "src_name",
                                              "block_num",
                                              "tx_idx",
                                              "log_idx",
                                              "abi_idx")
values (1,
        '\x1234',
        floor(extract(epoch from timestamptz '2024-05-26T13:38:25.000000Z')),
        '\x1234',
        '\xbe77e00000000000000000000000000000000000',
        100,
        '\xb0b0000000000000000000000000000000000000',
        1000,
        'sendtag_checkout_receipts',
        'sendtag_checkout_receipts',
        1235,
        0,
        0,
        0);

insert into public.referrals (referrer_id, referred_id, tag)
values (tests.get_supabase_uid('bob'),
        tests.get_supabase_uid('belle'),
        'belle');

select tests.authenticate_as('belle');

-- bob is tied for first place referrals and top for rewards
select tests.authenticate_as('bob');

select results_eq(
    $$
        select ("user").id, referrals::int, rewards_usdc::int, referrals_rank::int, rewards_usdc_rank::int
        from public.leaderboard_referrals_all_time()
        where ("user").id = tests.get_supabase_uid('bob')
        limit 1
    $$,
    $$
        values (
            tests.get_supabase_uid('bob'),
            1,
            1000,
            2,
            1
        )
    $$,
    'bob is tied for first place referrals and top for rewards'
);

-- ensure anonymous users cannot see the leaderboard
select tests.clear_authentication();

select throws_ok(
    $$
        select *
        from public.leaderboard_referrals_all_time()
    $$,
    'permission denied for function leaderboard_referrals_all_time',
    'User should not be able to see the leaderboard'
);

select finish();

ROLLBACK;
