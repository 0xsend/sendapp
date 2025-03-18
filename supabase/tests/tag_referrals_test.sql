-- Tag referrals test
BEGIN;
SELECT
    plan(9);
CREATE EXTENSION "basejump-supabase_test_helpers";
GRANT USAGE ON SCHEMA tests TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO service_role;
-- Creating a test user
SELECT
    tests.create_supabase_user('bob');
SELECT
    tests.create_supabase_user('alice');
SELECT
    tests.create_supabase_user('bob2');
INSERT INTO send_accounts(
    user_id,
    address,
    chain_id,
    init_code)
VALUES (
    tests.get_supabase_uid(
        'bob'),
    '0xb0b0000000000000000000000000000000000000',
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
        'bob2'),
    '0xb0b2000000000000000000000000000000000000',
    1,
    '\\x00112233445566778899AABBCCDDEEFF');
INSERT INTO sendtag_checkout_receipts(
    chain_id,
    log_addr,
    tx_hash,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx,
    block_time,
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
    0,
    1234567890,
    '\xb0b0000000000000000000000000000000000000',
    1,
    '\x0000000000000000000000000000000000000000',
    0),
( -- confirm for sendtag @alice
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    'sendtag_checkout_receipts',
    'alice',
    2,
    0,
    0,
    0,
    1234567890,
    '\xa71ce00000000000000000000000000000000000',
    1,
    '\x0000000000000000000000000000000000000000',
    0),
( -- confirm for sendtag @wonderland
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    'sendtag_checkout_receipts',
    'wonderland',
    3,
    0,
    0,
    0,
    1234567890,
    '\xa71ce00000000000000000000000000000000000',
    1,
    '\x0000000000000000000000000000000000000000',
    0),
( -- confirm for sendtag @whiterabbit
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    'sendtag_checkout_receipts',
    'whiterabbit',
    4,
    0,
    0,
    0,
    1234567890,
    '\xa71ce00000000000000000000000000000000000',
    1,
    '\x0000000000000000000000000000000000000000',
    0),
( -- confirm for sendtag @redroses
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    'sendtag_checkout_receipts',
    'redroses',
    5,
    0,
    0,
    0,
    1234567890,
    '\xa71ce00000000000000000000000000000000000',
    1,
    '\x0000000000000000000000000000000000000000',
    0);
-- Inserting a tag for test user
INSERT INTO tags(
    name,
    user_id)
VALUES (
    'alice',
    tests.get_supabase_uid(
        'alice'));
INSERT INTO tags(
    name,
    user_id)
VALUES (
    'redroses',
    tests.get_supabase_uid(
        'alice'));
-- Confirm tags with the service role
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
SELECT
    confirm_tags('{alice}',(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = '\xa71ce00000000000000000000000000000000000'
                AND src_name = 'alice'),(
            SELECT
                referral_code
            FROM public.profiles
            WHERE
                id = tests.get_supabase_uid('bob')));
-- Verify that the tags were confirmed
SELECT
    isnt_empty($$
        SELECT
            * FROM tags
            WHERE
                status = 'confirmed'::tag_status
                AND user_id = tests.get_supabase_uid('alice') $$, 'Tags should be confirmed');
SELECT
    isnt_empty($test$
        SELECT
            referrer_id, referred_id, created_at FROM referrals
            WHERE
                referrer_id = tests.get_supabase_uid('bob')
                AND referred_id = tests.get_supabase_uid('alice') $test$, 'Referral should be created');
-- Verify user cannot have two referrers
SELECT
    confirm_tags('{redroses}',(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = '\xa71ce00000000000000000000000000000000000'
                AND src_name = 'redroses'),(
            SELECT
                referral_code
            FROM public.profiles
            WHERE
                id = tests.get_supabase_uid('bob2')));
-- Verify that the tags were confirmed
SELECT
    isnt_empty($$
        SELECT
            * FROM tags
            WHERE
                status = 'confirmed'::tag_status
                AND user_id = tests.get_supabase_uid('alice') $$, 'Tags should be confirmed');
-- Verify no referral was created
SELECT
    is_empty($test$
        SELECT
            referrer_id, referred_id, created_at FROM referrals
            WHERE
                referrer_id = tests.get_supabase_uid('bob2')
                AND referred_id = tests.get_supabase_uid('alice') $test$, 'Referral should not be created');
-- Verify user can see referral activity
SELECT
    tests.authenticate_as('bob');
SELECT
    results_eq($$
        SELECT
            data ->> 'tags',(from_user).tags,(to_user).tags FROM activity_feed
            WHERE
                event_name = 'referrals' $$, $$
            VALUES ('["alice"]', NULL::text[], '{"alice","redroses"}'::text[]) $$, 'verify referral activity was created');
-- admin deleting referral should delete activity
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
DELETE FROM referrals
WHERE referrer_id = tests.get_supabase_uid('bob')
    AND referred_id = tests.get_supabase_uid('alice');
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM activity
            WHERE
                event_name = 'referrals'
                AND event_id = sha256(decode(replace(tests.get_supabase_uid('alice')::text, '-', ''), 'hex'))::text $$, $$
            VALUES (0) $$, 'verify referral activity was deleted');
-- Verify invalid referral code still confirms tags
SELECT
    tests.authenticate_as('alice');
INSERT INTO tags(
    name,
    user_id)
VALUES (
    'wonderland',
    tests.get_supabase_uid(
        'alice'));
-- Confirm tags with the service role
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
SELECT
    confirm_tags('{wonderland}',(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = '\xa71ce00000000000000000000000000000000000'
                AND src_name = 'wonderland'), 'invalid');
-- Verify that the tags were confirmed
SELECT
    isnt_empty($$
        SELECT
            * FROM tags
            WHERE
                status = 'confirmed'::tag_status
                AND user_id = tests.get_supabase_uid('alice')
                AND name = 'wonderland' $$, 'Tags should be confirmed');
-- Verify passing my own referral code does not create a referral
SELECT
    tests.authenticate_as('alice');
INSERT INTO tags(
    name,
    user_id)
VALUES (
    'whiterabbit',
    tests.get_supabase_uid(
        'alice'));
-- Confirm tags with the service role
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
SELECT
    confirm_tags('{whiterabbit}',(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = '\xa71ce00000000000000000000000000000000000'
                AND src_name = 'whiterabbit'),(
            SELECT
                referral_code
            FROM public.profiles
            WHERE
                id = tests.get_supabase_uid('alice')));
-- Verify that the tags were confirmed
SELECT
    isnt_empty($$
        SELECT
            * FROM tags
            WHERE
                status = 'confirmed'::tag_status
                AND user_id = tests.get_supabase_uid('alice')
                AND name = 'whiterabbit' $$, 'Tags should be confirmed');
-- Verify no referral was created
SELECT
    is_empty($$
        SELECT
            * FROM referrals
            WHERE
                referrer_id = tests.get_supabase_uid('alice') $$, 'Referral should not be created');
SELECT
    finish();
ROLLBACK;
