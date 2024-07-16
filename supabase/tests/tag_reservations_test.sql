-- Tag reserverations for preconfirmed tags
BEGIN;

SELECT plan(6);

CREATE EXTENSION "basejump-supabase_test_helpers";

SELECT tests.create_supabase_user('bob');

SELECT tests.authenticate_as('bob');

SELECT throws_ok(
    $test$
    INSERT INTO tag_reservations (tag_name, chain_address)
    VALUES (
        'reservation',
        '0x0000000000000000000000000000000000000000'
      ) $test$,
    'new row violates row-level security policy for table "tag_reservations"',
    'User cannot add to the tag reserverations'
);

-- service role can add to the tag reserverations and query it
SET ROLE service_role;

INSERT INTO tag_reservations (tag_name, chain_address)
VALUES (
    'reservation',
    '0x0000000000000000000000000000000000000000'
),
('reservation2', NULL);

SELECT isnt_empty(
    $test$
    SELECT *
    FROM tag_reservations $test$,
    'Tag reserverations should not be empty'
);

-- tag creator cannot reserve a tag that is on the reserverations with a different address
SET ROLE TO postgres;

-- verify the bob address
INSERT INTO chain_addresses (address, user_id)
VALUES (
    '0x0000000000000000000000000000000000000000',
    tests.get_supabase_uid('bob')
);

-- create a tag taker
SELECT tests.create_supabase_user('alice');

SELECT tests.authenticate_as('alice');

SET ROLE TO postgres;

-- verify the tag taker address
INSERT INTO chain_addresses (address, user_id)
VALUES (
    '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
    tests.get_supabase_uid('alice')
);

SELECT tests.authenticate_as('alice');

SELECT throws_ok(
    $test$
    INSERT INTO tags(name, user_id)
    VALUES (
        'reservation',
        tests.get_supabase_uid('alice')
      ) $test$,
    'You don''t got the riz for the tag: reservation',
    'User cannot reserve a tag that is on the reserverations with a different address'
);

SELECT throws_ok(
    $test$
    INSERT INTO tags(name, user_id)
    VALUES (
        'reservation2',
        tests.get_supabase_uid('alice')
      ) $test$,
    'You don''t got the riz for the tag: reservation2',
    'User cannot reserve a tag that is on the reserverations with a NULL address'
);

-- tag owner can reserve a tag that is on the reserverations with the same verified address
SELECT tests.authenticate_as('bob');

INSERT INTO tags (name, user_id)
VALUES (
    'reservation',
    tests.get_supabase_uid('bob')
);

SELECT isnt_empty(
    $test$
    SELECT *
    FROM tags
    WHERE name = 'reservation' $test$,
    'Tag should be reserved'
);

-- service role can confirm a tag that is on the
SET role TO service_role;

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('bob'),
    '0xb0b0000000000000000000000000000000000000',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

INSERT INTO send_account_transfers (
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
    f,
    t,
    v
)
VALUES (
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    'send_account_transfers',
    'send_account_transfers',
    1,
    0,
    0,
    0,
    1234567890,
    '\xb0b0000000000000000000000000000000000000',
    '\x3F14F917FB2DF7E0F3C6B06BB0FA0522FBEA4EEC',
    1
);

SELECT confirm_tags(
    '{reservation}',
    (
        SELECT event_id
        FROM send_account_transfers
        WHERE f = '\xb0b0000000000000000000000000000000000000'
    ),
    NULL
);

SET role TO postgres;

-- tag should be confirmed
SELECT tests.authenticate_as('bob');

SELECT isnt_empty(
    $test$
    SELECT *
    FROM tags
    WHERE name = 'reservation' $test$,
    'Tag should be confirmed'
);

SELECT finish();

ROLLBACK;
