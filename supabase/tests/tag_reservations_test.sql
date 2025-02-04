-- Tag reservations for preconfirmed tags
BEGIN;
SELECT
    plan(6);
CREATE EXTENSION "basejump-supabase_test_helpers";
SELECT
    tests.create_supabase_user('bob');
SELECT
    tests.authenticate_as('bob');
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('bob'), '0xb0b0000000000000000000000000000000000000', 1, '\\x00112233445566778899AABBCCDDEEFF');
-- Verify user cannot add to the tag reservations
SELECT
    throws_ok($test$ INSERT INTO tag_reservations(tag_name, chain_address)
            VALUES ('reservation', '0xb0b0000000000000000000000000000000000000') $test$, 'new row violates row-level security policy for table "tag_reservations"', 'User cannot add to the tag reservations');
-- Service role can add to the tag reservations and query it
SET ROLE service_role;
INSERT INTO tag_reservations(tag_name, chain_address)
    VALUES ('reservation', '0xb0b0000000000000000000000000000000000000'),
('reservation2', NULL);
SELECT
    isnt_empty($test$
        SELECT
            * FROM tag_reservations $test$, 'Tag reservations should not be empty');
-- Tag creator cannot reserve a tag that is on the reservations with a different address
SET ROLE TO postgres;
-- Verify the bob address
INSERT INTO chain_addresses(address, user_id)
    VALUES ('0xb0b0000000000000000000000000000000000000', tests.get_supabase_uid('bob'));
-- Create a tag taker
SELECT
    tests.create_supabase_user('alice');
SELECT
    tests.authenticate_as('alice');
SET ROLE TO postgres;
-- Verify the tag taker address
INSERT INTO chain_addresses(address, user_id)
    VALUES ('0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f', tests.get_supabase_uid('alice'));
SELECT
    tests.authenticate_as('alice');
SELECT
    throws_ok($test$ INSERT INTO tags(name, status)
            VALUES ('reservation', 'pending') $test$, 'You don''t got the riz for the tag: reservation', 'User cannot reserve a tag that is on the reservations with a different address');
SELECT
    throws_ok($test$ INSERT INTO tags(name, status)
            VALUES ('reservation2', 'pending') $test$, 'You don''t got the riz for the tag: reservation2', 'User cannot reserve a tag that is on the reservations with a NULL address');
-- Tag owner can reserve a tag that is on the reservations with the same verified address
SELECT
    tests.authenticate_as('bob');
SELECT
    create_tag('reservation',(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('bob')));
SELECT
    isnt_empty($test$
        SELECT
            * FROM tags
            WHERE
                name = 'reservation' $test$, 'Tag should be reserved');
-- Service role can confirm a tag that is on the reservations
SET ROLE TO service_role;
-- Create send account for bob
INSERT INTO sendtag_checkout_receipts(chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx, block_time, sender, amount, referrer, reward)
    VALUES (8453, '\x5afe000000000000000000000000000000000000', '\x1234567890123456789012345678901234567890123456789012345678901234', 'sendtag_checkout_receipts', 'sendtag_checkout_receipts', 1, 0, 0, 0, 1234567890, '\xb0b0000000000000000000000000000000000000', 1, '\x0000000000000000000000000000000000000000', 0);
-- Confirm the tag
SELECT
    confirm_tags(ARRAY['reservation']::citext[],(
            SELECT
                id
            FROM send_accounts
            WHERE
                user_id = tests.get_supabase_uid('bob')),(
            SELECT
                event_id
            FROM sendtag_checkout_receipts
            WHERE
                sender = decode(substring('0xb0b0000000000000000000000000000000000000' FROM 3), 'hex')), NULL -- No referral code
);
SELECT
    tests.authenticate_as('bob');
SELECT
    isnt_empty($test$
        SELECT
            * FROM tags
            WHERE
                name = 'reservation' $test$, 'Tag should be confirmed');
SELECT
    finish();
