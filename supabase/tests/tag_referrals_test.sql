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
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('bob'), '0xb0b0000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF'),
(tests.get_supabase_uid('alice'), '0xa71ce00000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF'),
(tests.get_supabase_uid('bob2'), '0xb0b2000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');
INSERT INTO sendtag_checkout_receipts(chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, block_time, sender, amount, referrer, reward)
    VALUES (8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'sendtag_checkout_receipts', 1, 0, 0, 0, 1234567890, '\xb0b0000000000000000000000000000000000000', 1, '\x0000000000000000000000000000000000000000', 0),
(
        -- confirm for sendtag @alice
        8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'alice', 2, 0, 0, 0, 1234567890, '\xa71ce00000000000000000000000000000000000', 1, '\x0000000000000000000000000000000000000000', 0),
(
        -- confirm for sendtag @wonderland
        8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'wonderland', 3, 0, 0, 0, 1234567890, '\xa71ce00000000000000000000000000000000000', 1, '\x0000000000000000000000000000000000000000', 0),
(
        -- confirm for sendtag @whiterabbit
        8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'whiterabbit', 4, 0, 0, 0, 1234567890, '\xa71ce00000000000000000000000000000000000', 1, '\x0000000000000000000000000000000000000000', 0),
(
        -- confirm for sendtag @redroses
        8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'redroses', 5, 0, 0, 0, 1234567890, '\xa71ce00000000000000000000000000000000000', 1, '\x0000000000000000000000000000000000000000', 0);
-- Inserting a tag
INSERT INTO tags(name, status)
    VALUES ('alice', 'pending');
-- Confirm tags with the service role
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
-- Get alice's send account id
DO $$
DECLARE
    _send_account_id uuid;
    _referral_code text;
    _event_id text;
BEGIN
    -- Get the send account id
    SELECT
        id INTO _send_account_id
    FROM
        send_accounts
    WHERE
        user_id = tests.get_supabase_uid('alice');
    -- Get Bob's referral code
    SELECT
        referral_code INTO _referral_code
    FROM
        public.profiles
    WHERE
        id = tests.get_supabase_uid('bob');
    -- Get event id
    SELECT
        event_id INTO _event_id
    FROM
        sendtag_checkout_receipts
    WHERE
        sender = '\xa71ce00000000000000000000000000000000000'
        AND src_name = 'alice';
    -- Confirm the tag with referral code
    PERFORM
        confirm_tags(ARRAY['alice']::citext[], _send_account_id, _event_id, _referral_code);
END
$$;
-- Verify that the tags were confirmed
SELECT
    isnt_empty($$
        SELECT
            * FROM tags
            WHERE
                status = 'confirmed'::tag_status
                AND id IN (
                    SELECT
                        tag_id
                    FROM send_account_tags sat
                    JOIN send_accounts sa ON sa.id = sat.send_account_id
                    WHERE
                        sa.user_id = tests.get_supabase_uid('alice')) $$, 'Tags should be confirmed');
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM referrals r
            JOIN tags t ON t.id = r.tag_id
            WHERE
                r.referrer_id = tests.get_supabase_uid('bob') -- Bob is the referrer
                AND r.referred_id = tests.get_supabase_uid('alice') $$, -- Alice was referred
                $$
            VALUES (1) $$, 'Referral should be created');
-- Verify user cannot have two referrers
DO $$
DECLARE
    _send_account_id uuid;
BEGIN
    SELECT
        id INTO _send_account_id
    FROM
        send_accounts
    WHERE
        user_id = tests.get_supabase_uid('alice');
    -- Insert redroses tag
    INSERT INTO tags(name, status)
        VALUES ('redroses', 'pending');
    -- Confirm the tag
    PERFORM
        confirm_tags(ARRAY['redroses']::citext[], _send_account_id,(
                SELECT
                    event_id
                FROM sendtag_checkout_receipts
                WHERE
                    sender = '\xa71ce00000000000000000000000000000000000'
                    AND src_name = 'redroses'), NULL);
END
$$;
-- Verify that the tags were confirmed
SELECT
    isnt_empty($$
        SELECT
            * FROM tags
            WHERE
                status = 'confirmed'::tag_status
                AND id IN (
                    SELECT
                        tag_id
                    FROM send_account_tags sat
                    JOIN send_accounts sa ON sa.id = sat.send_account_id
                    WHERE
                        sa.user_id = tests.get_supabase_uid('alice')) $$, 'Tags should be confirmed');
-- Verify no referral was created
SELECT
    is_empty($$
        SELECT
            referrer_id, referred_id, created_at FROM referrals
            WHERE
                referrer_id = tests.get_supabase_uid('bob2')
                AND referred_id = tests.get_supabase_uid('alice') $$, 'Referral should not be created');
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
-- Insert wonderland tag
INSERT INTO tags(name, status)
    VALUES ('wonderland', 'pending');
-- Confirm tags with the service role
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
DO $$
DECLARE
    _send_account_id uuid;
BEGIN
    SELECT
        id INTO _send_account_id
    FROM
        send_accounts
    WHERE
        user_id = tests.get_supabase_uid('alice');
    PERFORM
        confirm_tags(ARRAY['wonderland']::citext[], _send_account_id,(
                SELECT
                    event_id
                FROM sendtag_checkout_receipts
                WHERE
                    sender = '\xa71ce00000000000000000000000000000000000'
                    AND src_name = 'wonderland'), 'invalid');
END
$$;
-- Verify that the tags were confirmed
SELECT
    isnt_empty($$
        SELECT
            * FROM tags
            WHERE
                status = 'confirmed'::tag_status
                AND id IN (
                    SELECT
                        tag_id
                    FROM send_account_tags sat
                    JOIN send_accounts sa ON sa.id = sat.send_account_id
                    WHERE
                        sa.user_id = tests.get_supabase_uid('alice'))
                AND name = 'wonderland' $$, 'Tags should be confirmed');
-- Verify passing my own referral code does not create a referral
SELECT
    tests.authenticate_as('alice');
-- Insert whiterabbit tag
INSERT INTO tags(name, status)
    VALUES ('whiterabbit', 'pending');
-- Confirm tags with the service role
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
DO $$
DECLARE
    _send_account_id uuid;
BEGIN
    SELECT
        id INTO _send_account_id
    FROM
        send_accounts
    WHERE
        user_id = tests.get_supabase_uid('alice');
    PERFORM
        confirm_tags(ARRAY['whiterabbit']::citext[], _send_account_id,(
                SELECT
                    event_id
                FROM sendtag_checkout_receipts
                WHERE
                    sender = '\xa71ce00000000000000000000000000000000000'
                    AND src_name = 'whiterabbit'), NULL);
END
$$;
-- Verify that the tags were confirmed
SELECT
    isnt_empty($$
        SELECT
            * FROM tags
            WHERE
                status = 'confirmed'::tag_status
                AND id IN (
                    SELECT
                        tag_id
                    FROM send_account_tags sat
                    JOIN send_accounts sa ON sa.id = sat.send_account_id
                    WHERE
                        sa.user_id = tests.get_supabase_uid('alice'))
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
