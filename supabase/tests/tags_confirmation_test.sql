-- 3. Tag Confirmation
BEGIN;
SELECT
    plan(10);
CREATE EXTENSION "basejump-supabase_test_helpers";
GRANT USAGE ON SCHEMA tests TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO service_role;
CREATE FUNCTION _event_id(_f bytea)
    RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    _id text;
BEGIN
    SELECT
        event_id
    FROM
        sendtag_checkout_receipts
    WHERE
        sender = _f INTO _id;
    RETURN _id;
END;
$$;
-- Creating test users
SELECT
    tests.create_supabase_user('bob');
SELECT
    tests.create_supabase_user('alice');
SELECT
    tests.create_supabase_user('hacker');
SELECT
    set_config('role', 'service_role', TRUE);
-- Create some sendtag_checkout_receipts
INSERT INTO sendtag_checkout_receipts(chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, block_time, sender, amount, referrer, reward)
    VALUES (8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'sendtag_checkout_receipts', 1, 0, 0, 0, 1234567890, '\xb0b0000000000000000000000000000000000000', 4, '\x0000000000000000000000000000000000000000', 0),
(8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'sendtag_checkout_receipts', 1, 0, 1, 0, 1234567890, '\xa71ce00000000000000000000000000000000000', 1, '\x0000000000000000000000000000000000000000', 0),
(8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'sendtag_checkout_receipts', 3, 0, 0, 0, 1234567890, '\xc401e00000000000000000000000000000000000', 1, '\x0000000000000000000000000000000000000000', 0);
-- Bob can register and confirm tags with valid transfers
SELECT
    tests.authenticate_as('bob');
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('bob'), '0xb0b0000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Create tags without user_id
SELECT
    create_tag('bob',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('bob')));
SELECT
    create_tag('bob_2',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('bob')));
SELECT
    create_tag('bob_3',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('bob')));
SELECT
    create_tag('bob_4',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('bob')));
-- Create send_account_tags associations
SELECT
    set_config('role', 'service_role', TRUE);
-- Confirm tags with correct event ID format
SELECT
    confirm_tags((ARRAY['bob', 'bob_2', 'bob_3', 'bob_4']::citext[]),(
        SELECT
            id
        FROM send_accounts
        WHERE
            user_id = tests.get_supabase_uid('bob')),(
        SELECT
            event_id
        FROM sendtag_checkout_receipts
        WHERE
            sender = decode(substring('\xb0b0000000000000000000000000000000000000' FROM 3), 'hex')), NULL);
-- Add detailed send_account_tags verification
SELECT
    results_eq($$
        SELECT
            t.name, t.status, CASE WHEN sa.address LIKE '\x%' THEN
                '0x' || substring(sa.address::text FROM 3)
            ELSE
                sa.address::text
            END::citext FROM send_account_tags sat
            JOIN tags t ON t.id = sat.tag_id
            JOIN send_accounts sa ON sa.id = sat.send_account_id
            WHERE
                sa.user_id = tests.get_supabase_uid('bob')
            ORDER BY t.name $$, $$
            VALUES ('bob'::citext, 'confirmed'::tag_status, '0xb0b0000000000000000000000000000000000000'::citext),('bob_2'::citext, 'confirmed'::tag_status, '0xb0b0000000000000000000000000000000000000'::citext),('bob_3'::citext, 'confirmed'::tag_status, '0xb0b0000000000000000000000000000000000000'::citext),('bob_4'::citext, 'confirmed'::tag_status, '0xb0b0000000000000000000000000000000000000'::citext) $$, 'send_account_tags should contain correct associations after confirmation');
SELECT
    tests.authenticate_as('bob');
SELECT
    results_eq($$
        SELECT
            count(*)::integer FROM send_account_tags sat
            JOIN tags t ON t.id = sat.tag_id
            JOIN send_accounts sa ON sa.id = sat.send_account_id
            WHERE
                t.status = 'confirmed'::tag_status
                AND sa.user_id = tests.get_supabase_uid('bob') $$, $$
            VALUES (4) $$, 'Tags should be confirmed and send_account_tags created');
-- Verify receipt was created
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM receipts
            WHERE
                event_id = _event_id('\xb0b0000000000000000000000000000000000000') $$, $$
            VALUES (1) $$, 'Receipt should be created');
SELECT
    results_eq($$
        SELECT
            jsonb_agg(tag ORDER BY tag)::text, tx_hash, value::integer, block_num::integer, tx_idx::integer, log_idx::integer FROM (
                SELECT
                    jsonb_array_elements_text(data -> 'tags') AS tag, data ->> 'tx_hash' AS tx_hash, data ->> 'value' AS value, data ->> 'block_num' AS block_num, data ->> 'tx_idx' AS tx_idx, data ->> 'log_idx' AS log_idx
                FROM activity_feed
                WHERE
                    event_name = 'tag_receipt_usdc') subquery GROUP BY tx_hash, value, block_num, tx_idx, log_idx $$, $$
            VALUES ('["bob", "bob_2", "bob_3", "bob_4"]', '\x1234567890123456789012345678901234567890123456789012345678901234', 4, 1, 0, 0) $$, 'Tag receipt activity was created');
SELECT
    tests.authenticate_as('alice');
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('alice'), '0xc401e00000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Inserting a tag for Alice
SELECT
    create_tag('alice',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('alice')));
-- Confirm tags with the service role
SELECT
    set_config('role', 'service_role', TRUE);
SELECT
    confirm_tags((ARRAY['alice']::citext[]),(
        SELECT
            id
        FROM send_accounts
        WHERE
            user_id = tests.get_supabase_uid('alice')),(
        SELECT
            event_id
        FROM sendtag_checkout_receipts
        WHERE
            sender = decode(substring('\xc401e00000000000000000000000000000000000' FROM 3), 'hex')), NULL);
-- Verify that the tags were confirmed for Alice
SELECT
    results_eq($$
        SELECT
            count(*)::integer FROM send_account_tags sat
            JOIN tags t ON t.id = sat.tag_id
            JOIN send_accounts sa ON sa.id = sat.send_account_id
            WHERE
                t.status = 'confirmed'::tag_status
                AND sa.user_id = tests.get_supabase_uid('alice') $$, $$
            VALUES (1) $$, 'Tags for Alice should be confirmed');
-- Verify receipt was created for Alice
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM receipts r
            JOIN sendtag_checkout_receipts scr ON scr.event_id = r.event_id
            WHERE
                scr.sender = decode(substring('\xc401e00000000000000000000000000000000000' FROM 3), 'hex') $$, $$
            VALUES (1) $$, 'Receipt should be created for Alice');
SELECT
    tests.authenticate_as('alice');
-- Add before activity checks
SELECT
    results_eq($$
        SELECT
            jsonb_agg(tag ORDER BY tag)::text, tx_hash, value::integer, block_num::integer, tx_idx::integer, log_idx::integer FROM (
                SELECT
                    jsonb_array_elements_text(data -> 'tags') AS tag, data ->> 'tx_hash' AS tx_hash, data ->> 'value' AS value, data ->> 'block_num' AS block_num, data ->> 'tx_idx' AS tx_idx, data ->> 'log_idx' AS log_idx
                FROM activity_feed
                WHERE
                    event_name = 'tag_receipt_usdc') subquery GROUP BY tx_hash, value, block_num, tx_idx, log_idx $$, $$
            VALUES ('["alice"]', '\x1234567890123456789012345678901234567890123456789012345678901234', 1, 3, 0, 0) $$, 'Tag receipt activity was created for Alice');
-- Verify hacker cannot see tag receipt
SELECT
    tests.authenticate_as('hacker');
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM tag_receipts
            WHERE
                tag_name = 'alice' $$, $$
            VALUES (0) $$, 'Hacker should not be able to see tag receipt');
-- Before test 8, add send_account for hacker
SELECT
    tests.authenticate_as('hacker');
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('hacker'), '0xaaaa000000000000000000000000000000000000', -- Valid hex address
        1, '\\x00112233445566778899AABBCCDDEEFF');
-- Then attempt to use duplicate receipt hash to confirm tag
INSERT INTO tags(name, status)
    VALUES ('hacker', 'pending');
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
SELECT
    throws_ok($$
        SELECT
            confirm_tags(ARRAY['hacker']::citext[],(
                    SELECT
                        id
                    FROM send_accounts
                    WHERE
                        user_id = tests.get_supabase_uid('hacker')), _event_id('\xa71ce00000000000000000000000000000000000'), NULL);
$$,
'Receipt event ID does not match the sender');
SELECT
    tests.authenticate_as('alice');
-- Alice attempts to reuse her receipt
INSERT INTO tags(name, status)
    VALUES ('queenofhacking', 'pending');
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
SELECT
    throws_ok($$
        SELECT
            confirm_tags(ARRAY['queenofhacking']::citext[],(
                    SELECT
                        id
                    FROM send_accounts
                    WHERE
                        user_id = tests.get_supabase_uid('alice')),(
                    SELECT
                        event_id
                    FROM sendtag_checkout_receipts
                    WHERE
                        sender = decode(substring('0xc401e00000000000000000000000000000000000' FROM 3), 'hex')
                LIMIT 1), NULL);
$$,
'duplicate key value violates unique constraint "receipts_event_id_idx"');
SELECT
    finish();
ROLLBACK;

