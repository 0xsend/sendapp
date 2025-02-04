BEGIN;
SELECT
    plan(10);
-- Create extension first
CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";
-- Create test users
SELECT
    tests.create_supabase_user('tag_owner');
SELECT
    tests.create_supabase_user('other_user');
SELECT
    tests.create_supabase_user('new_user');
-- Create send accounts
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('tag_owner'), '0x1234567890ABCDEF1234567890ABCDEF12345678', 1, '\\x00112233445566778899AABBCCDDEEFF'),
(tests.get_supabase_uid('other_user'), '0x9876543210FEDCBA9876543210FEDCBA98765432', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Create a tag
SELECT
    tests.authenticate_as('tag_owner');
SELECT
    create_tag('send_account_tag',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_owner')));
-- Create receipt as service_role
SET ROLE service_role;
-- Create receipt with matching sender address
INSERT INTO sendtag_checkout_receipts(chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, block_time, sender, amount, referrer, reward)
    VALUES (8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'test_tag', 1, 0, 0, 0, 1234567890, decode(substring('0x1234567890ABCDEF1234567890ABCDEF12345678' FROM 3), 'hex'), 1, '\x0000000000000000000000000000000000000000', 0);
-- Confirm first tag
SELECT
    confirm_tags(ARRAY['send_account_tag']::citext[],(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_owner')),(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = decode(substring('0x1234567890ABCDEF1234567890ABCDEF12345678' FROM 3), 'hex')), NULL);
-- Check that main_tag_id was set after confirming first tag
SELECT
    results_eq($$
        SELECT
            main_tag_id FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_owner') $$, $$
                SELECT
                    id FROM tags
                    WHERE
                        name = 'send_account_tag' $$, 'First confirmed tag should be set as main_tag_id');
-- Test that send_account_tags was created
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM send_account_tags sat
            JOIN tags t ON t.id = sat.tag_id
            WHERE
                t.name = 'send_account_tag'
                AND sat.send_account_id =(
                    SELECT
                        id
                    FROM send_accounts
                    WHERE
                        user_id = tests.get_supabase_uid('tag_owner')) $$, $$
            VALUES (1) $$, 'send_account_tags should be created');
-- Test that owner can see their send_account_tags
SELECT
    tests.authenticate_as('tag_owner');
SELECT
    results_eq($$
        SELECT
            COUNT(*)::integer FROM send_account_tags$$, $$
        VALUES (1) $$, 'Tag owner can see their send_account_tags');
-- Test that other user cannot see send_account_tags
SELECT
    tests.authenticate_as('other_user');
SELECT
    is_empty($$
        SELECT
            * FROM send_account_tags$$, 'Other users cannot see send_account_tags');
-- Test deleting send_account_tags
SELECT
    tests.authenticate_as('tag_owner');
SELECT
    sat.id AS sat_id,
    sat.send_account_id,
    sat.tag_id,
    t.name AS tag_name,
    t.status,
    sa.user_id,
    sa.user_id = auth.uid() AS is_owner
FROM
    send_account_tags sat
    JOIN tags t ON t.id = sat.tag_id
    JOIN send_accounts sa ON sa.id = sat.send_account_id;
-- Switch to service_role for delete
SET ROLE service_role;
-- Try delete with explicit auth check
DELETE FROM send_account_tags
WHERE id IN (
        SELECT
            sat.id
        FROM
            send_account_tags sat
            JOIN send_accounts sa ON sat.send_account_id = sa.id
            JOIN tags t ON sat.tag_id = t.id
        WHERE
            t.name = 'send_account_tag');
-- Switch back to authenticated user
SELECT
    tests.authenticate_as('tag_owner');
-- Check if delete worked
SELECT
    COUNT(*)
FROM
    send_account_tags sat
    JOIN tags t ON t.id = sat.tag_id
WHERE
    t.name = 'send_account_tag';
-- Test that tag status was updated to available
SELECT
    results_eq($$
        SELECT
            status::text FROM tags
            WHERE
                name = 'send_account_tag' $$, $$
            VALUES ('available'::text) $$, 'Tag should be available after deleting send_account_tags');
-- Test that tag user_id was cleared
SELECT
    results_eq($$
        SELECT
            user_id FROM tags
            WHERE
                name = 'send_account_tag' $$, $$
            VALUES (NULL::uuid) $$, 'Tag user_id should be NULL after deleting send_account_tags');
-- Create and confirm second tag
SELECT
    tests.authenticate_as('tag_owner');
SELECT
    create_tag('second_tag',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_owner')));
SELECT
    set_config('role', 'service_role', TRUE);
INSERT INTO sendtag_checkout_receipts(chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, block_time, sender, amount, referrer, reward)
    VALUES (8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901235', 'sendtag_checkout_receipts', 'test_tag', 2, 0, 0, 0, 1234567890, decode(substring('0x1234567890ABCDEF1234567890ABCDEF12345678' FROM 3), 'hex'), 1, '\x0000000000000000000000000000000000000000', 0);
SELECT
    confirm_tags(ARRAY['second_tag']::citext[],(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_owner')),(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                tx_hash = '\x1234567890123456789012345678901234567890123456789012345678901235'), NULL);
-- Delete first tag and verify main_tag_id updates
DELETE FROM send_account_tags
WHERE tag_id =(
        SELECT
            id
        FROM
            tags
        WHERE
            name = 'send_account_tag');
SELECT
    results_eq($$
        SELECT
            main_tag_id FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_owner') $$, $$
                SELECT
                    id FROM tags
                    WHERE
                        name = 'second_tag' $$, 'main_tag_id should update to next oldest tag when main tag is deleted');
-- Test manually changing main tag
SELECT
    tests.authenticate_as('tag_owner');
SELECT
    create_tag('third_tag',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_owner')));
-- Confirm third tag
SELECT
    set_config('role', 'service_role', TRUE);
INSERT INTO sendtag_checkout_receipts(chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, block_time, sender, amount, referrer, reward)
    VALUES (8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901236', 'sendtag_checkout_receipts', 'test_tag', 3, 0, 0, 0, 1234567890, decode(substring('0x1234567890ABCDEF1234567890ABCDEF12345678' FROM 3), 'hex'), 1, '\x0000000000000000000000000000000000000000', 0);
SELECT
    confirm_tags(ARRAY['third_tag']::citext[],(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('tag_owner')),(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                tx_hash = '\x1234567890123456789012345678901234567890123456789012345678901236'), NULL);
-- Update main tag to third_tag
SELECT
    tests.authenticate_as('tag_owner');
UPDATE
    send_accounts
SET
    main_tag_id =(
        SELECT
            id
        FROM
            tags
        WHERE
            name = 'third_tag')
WHERE
    user_id = tests.get_supabase_uid('tag_owner');
-- Verify main tag was updated
SELECT
    results_eq($$
        SELECT
            t.name::text -- Cast citext to text for comparison
            FROM send_accounts sa
            JOIN tags t ON t.id = sa.main_tag_id
            WHERE
                sa.user_id = tests.get_supabase_uid('tag_owner') $$, $$
            VALUES ('third_tag'::text) $$, 'User should be able to change their main tag to any of their confirmed tags');
-- Test that we can't set main_tag_id back to NULL once set
SELECT
    throws_ok($$ UPDATE
            send_accounts
        SET
            main_tag_id = NULL
            WHERE
                user_id = tests.get_supabase_uid('tag_owner') $$, 'Cannot set main_tag_id to NULL while you have confirmed tags', -- Updated to match actual error
                'Should not be able to set main_tag_id back to NULL once set');
-- But NULL should be allowed for new accounts
SELECT
    set_config('role', 'service_role', TRUE);
SELECT
    lives_ok($$ INSERT INTO send_accounts(user_id, address, chain_id, init_code, main_tag_id)
            VALUES (tests.get_supabase_uid('new_user'), -- Use new_user instead of other_user
                '0x9999999999999999999999999999999999999999', 1, '\\x00112233445566778899AABBCCDDEEFF', NULL) $$, 'Should allow NULL main_tag_id for new accounts');
SELECT
    finish();
ROLLBACK;

