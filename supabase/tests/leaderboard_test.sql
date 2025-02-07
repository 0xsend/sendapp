BEGIN;
SELECT
    plan(4);
CREATE EXTENSION "basejump-supabase_test_helpers";
-- alice and bob are top referral users
SELECT
    tests.create_supabase_user('alice');
SELECT
    tests.create_supabase_user('bob');
SELECT
    tests.create_supabase_user('belle');
-- create send accounts
INSERT INTO public.send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('alice'), '0xa71ce00000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF'),
(tests.get_supabase_uid('bob'), '0xb0b0000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF'),
(tests.get_supabase_uid('belle'), '0xbe77e00000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- create send_account_created
INSERT INTO public.send_account_created(chain_id, log_addr, block_time, user_op_hash, tx_hash, account, ig_name, src_name, block_num, tx_idx, log_idx)
    VALUES (1, '\x1234', floor(extract(epoch FROM timestamptz '2024-05-26T13:38:25.000000Z')), '\x1234', '\x1234', '0xa71ce00000000000000000000000000000000000', 'send_account_created', 'send_account_created', 1234, 0, 0),
(1, '\x1234', floor(extract(epoch FROM timestamptz '2024-05-26T13:38:25.000000Z')), '\x1234', '\x1234', '0xb0b0000000000000000000000000000000000000', 'send_account_created', 'send_account_created', 1234, 1, 0),
(1, '\x1234', floor(extract(epoch FROM timestamptz '2024-05-26T13:38:25.000000Z')), '\x1234', '\x1234', '0xbe77e00000000000000000000000000000000000', 'send_account_created', 'send_account_created', 1234, 2, 0);
INSERT INTO public.sendtag_checkout_receipts("chain_id", "log_addr", "block_time", "tx_hash", "sender", "amount", "referrer", "reward", "ig_name", "src_name", "block_num", "tx_idx", "log_idx", "abi_idx")
    VALUES (1, '\x1234', floor(extract(epoch FROM timestamptz '2024-05-26T13:38:25.000000Z')), '\x1234', '\xb0b0000000000000000000000000000000000000', 100, '\xa71ce00000000000000000000000000000000000', 100, 'sendtag_checkout_receipts', 'sendtag_checkout_receipts', 1234, 0, 0, 0),
(1, '\x1234', floor(extract(epoch FROM timestamptz '2024-05-26T13:38:25.000000Z')), '\x1234', '\xbe77e00000000000000000000000000000000000', 100, '\xb0b0000000000000000000000000000000000000', 1000, 'sendtag_checkout_receipts', 'sendtag_checkout_receipts', 1235, 0, 0, 0);
SELECT
    tests.authenticate_as('bob');
SELECT
    create_tag('bob',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('bob')));
SELECT
    tests.authenticate_as_service_role();
SELECT
    confirm_tags(ARRAY['bob']::citext[],(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('bob')),(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = decode(substring('\xb0b0000000000000000000000000000000000000' FROM 3), 'hex')),(
            SELECT
                referral_code
            FROM profiles
            WHERE
                id = tests.get_supabase_uid('alice')));
-- alice is at the top of the leaderboard
SELECT
    tests.authenticate_as('alice');
SELECT
    results_eq($$
        SELECT
            ("user").id, referrals::int, rewards_usdc::int FROM public.leaderboard_referrals_all_time()
        WHERE ("user").id = tests.get_supabase_uid('alice')
    LIMIT 1 $$, $$
VALUES (tests.get_supabase_uid('alice'), 1, 100) $$, 'alice is at the top of the leaderboard');
-- bob is not on the leaderboard
SELECT
    is_empty($$
        SELECT
            * FROM public.leaderboard_referrals_all_time()
        WHERE ("user").id = tests.get_supabase_uid('bob')
    ORDER BY referrals DESC LIMIT 1 $$, 'bob is not on the leaderboard');
-- bob refers belle
SELECT
    tests.authenticate_as('belle');
SELECT
    create_tag('belle',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('belle')));
SELECT
    tests.authenticate_as_service_role();
SELECT
    confirm_tags(ARRAY['belle']::citext[],(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('belle')),(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = decode(substring('\xbe77e00000000000000000000000000000000000' FROM 3), 'hex')),(
            SELECT
                referral_code
            FROM profiles
            WHERE
                id = tests.get_supabase_uid('bob')));
SELECT
    tests.authenticate_as('bob');
SELECT
    results_eq($$
        SELECT
            ("user").id, referrals::int, rewards_usdc::int FROM public.leaderboard_referrals_all_time()
        WHERE ("user").id = tests.get_supabase_uid('bob')
    LIMIT 1 $$, $$
VALUES (tests.get_supabase_uid('bob'), 1, 1000) $$, 'bob is tied for first place referrals and top for rewards');
-- ensure anonymous users cannot see the leaderboard
SELECT
    tests.clear_authentication();
SELECT
    throws_ok($$
        SELECT
            * FROM public.leaderboard_referrals_all_time() $$, 'permission denied for function leaderboard_referrals_all_time', 'User should not be able to see the leaderboard');
SELECT
    finish();
ROLLBACK;
