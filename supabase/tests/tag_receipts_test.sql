BEGIN;
SELECT
    plan(4);
CREATE EXTENSION "basejump-supabase_test_helpers";
-- Create test user
SELECT
    tests.create_supabase_user('receipt_owner');
-- Create send account
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('receipt_owner'), '0x1234567890ABCDEF1234567890ABCDEF12345678', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Create a tag
SELECT
    set_config('role', 'service_role', TRUE);
INSERT INTO tags(name, status)
    VALUES ('receipt_tag', 'pending');
INSERT INTO send_account_tags(send_account_id, tag_id)
    VALUES ((
            SELECT
                id
            FROM
                send_accounts
            WHERE
                user_id = tests.get_supabase_uid('receipt_owner')),
(
                SELECT
                    id
                FROM
                    tags
                WHERE
                    name = 'receipt_tag'));
-- Before inserting into sendtag_checkout_receipts
INSERT INTO sendtag_checkout_receipts(chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, block_time, sender, amount, referrer, reward)
    VALUES (8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'test_tag', 1, 0, 0, 0, 1234567890, decode(substring('0x1234567890ABCDEF1234567890ABCDEF12345678' FROM 3), 'hex'), 1, '\x0000000000000000000000000000000000000000', 0);
-- Use the receipt's event_id when confirming
SELECT
    confirm_tags(ARRAY['receipt_tag']::citext[],(
            SELECT
                send_accounts.id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('receipt_owner')),(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = decode(substring('0x1234567890ABCDEF1234567890ABCDEF12345678' FROM 3), 'hex')), NULL);
-- Test that tag_receipt was created with tag_id
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM tag_receipts
            WHERE
                tag_id IS NOT NULL $$, $$
            VALUES (1) $$, 'tag_receipt should be created with tag_id');
-- Test that tag_id matches the tag
SELECT
    results_eq($$
        SELECT
            tag_id FROM tag_receipts
            WHERE
                tag_name = 'receipt_tag' $$, $$
                SELECT
                    id FROM tags
                    WHERE
                        name = 'receipt_tag' $$, 'tag_receipt tag_id should match the tag id');
-- Test that owner can see their tag_receipts
SELECT
    tests.authenticate_as('receipt_owner');
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM tag_receipts
            WHERE
                tag_name = 'receipt_tag' $$, $$
            VALUES (1) $$, 'Tag owner can see their tag_receipts');
-- Test that other users cannot see tag_receipts
SELECT
    tests.create_supabase_user('other_user');
SELECT
    tests.authenticate_as('other_user');
SELECT
    is_empty($$
        SELECT
            * FROM tag_receipts $$, 'Other users cannot see tag_receipts');
SELECT
    finish();
ROLLBACK;

