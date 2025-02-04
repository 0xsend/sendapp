BEGIN;
SELECT
    plan(3);
CREATE EXTENSION "basejump-supabase_test_helpers";
GRANT USAGE ON SCHEMA tests TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO service_role;
-- Create users and accounts
SELECT
    tests.create_supabase_user('test_user_from');
SELECT
    tests.create_supabase_user('test_user_to');
SELECT
    tests.authenticate_as('test_user_from');
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('test_user_from'), '0xb0b0000000000000000000000000000000000001', 1, '\\x00112233445566778899AABBCCDDEEFF');
SELECT
    tests.authenticate_as('test_user_to');
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('test_user_to'), '0xb0b0000000000000000000000000000000000002', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Create and confirm tags first
SELECT
    tests.authenticate_as('test_user_from');
SELECT
    create_tag('tag1',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('test_user_from')));
SELECT
    create_tag('tag2',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('test_user_from')));
SELECT
    tests.authenticate_as('test_user_to');
SELECT
    create_tag('tag3',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('test_user_to')));
-- Add receipts and confirm tags
SELECT
    tests.clear_authentication();
SELECT
    set_config('role', 'service_role', TRUE);
INSERT INTO sendtag_checkout_receipts(chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, block_time, sender, amount, referrer, reward)
    VALUES
        -- Receipt for test_user_from's tags
(8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'sendtag_checkout_receipts', 1, 0, 0, 0, 1234567890, '\xb0b0000000000000000000000000000000000001', -- Match test_user_from's address
            2, '\x0000000000000000000000000000000000000000', 0),
        -- Receipt for test_user_to's tag
(8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901235', 'sendtag_checkout_receipts', 'sendtag_checkout_receipts', 1, 0, 1, 0, 1234567890, '\xb0b0000000000000000000000000000000000002', -- Match test_user_to's address
            1, '\x0000000000000000000000000000000000000000', 0);
SELECT
    confirm_tags(ARRAY['tag1', 'tag2']::citext[],(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('test_user_from')),(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = decode(substring('0xb0b0000000000000000000000000000000000001' FROM 3), 'hex')), NULL);
SELECT
    confirm_tags(ARRAY['tag3']::citext[],(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('test_user_to')),(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = decode(substring('0xb0b0000000000000000000000000000000000002' FROM 3), 'hex')), NULL);
INSERT INTO activity(event_id, created_at, event_name, from_user_id, to_user_id, data)
    VALUES ('test', now(), 'test_event', tests.get_supabase_uid('test_user_from'), tests.get_supabase_uid('test_user_to'), '{"key": "value"}');
-- Run the activity feed tests
SELECT
    tests.authenticate_as('test_user_from');
SELECT
    results_eq($$
        SELECT
            event_name,(from_user).id,(to_user).tags, data FROM activity_feed
            WHERE
                event_name = 'test_event' -- Filter for our specific test event
                $$, $$
            VALUES ('test_event', tests.get_supabase_uid('test_user_from'), '{tag3}'::text[], '{"key": "value"}'::jsonb) $$, 'Test if the activity_feed view returns the correct data for the authenticated user');
SELECT
    tests.authenticate_as('test_user_to');
SELECT
    results_eq($$
        SELECT
            event_name,(from_user).tags,(to_user).id, data FROM activity_feed
            WHERE
                event_name = 'test_event' -- Filter for our specific test event
                $$, $$
            VALUES ('test_event', '{tag1,tag2}'::text[], tests.get_supabase_uid('test_user_to'), '{"key": "value"}'::jsonb) $$, 'Test if the activity_feed view returns the correct data for the other user');
SELECT
    tests.clear_authentication();
SELECT
    is_empty($$
        SELECT
            * FROM activity_feed $$, 'Test if the activity_feed view returns no data for an unauthenticated user');
SELECT
    finish();
ROLLBACK;

