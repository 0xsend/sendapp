-- Tag reserverations for preconfirmed tags
BEGIN;

SELECT plan(6);

CREATE EXTENSION "basejump-supabase_test_helpers";

SELECT tests.create_supabase_user('tag_owner');

SELECT tests.authenticate_as('tag_owner');

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

-- verify the tag_owner address
INSERT INTO chain_addresses (address, user_id)
VALUES (
    '0x0000000000000000000000000000000000000000',
    tests.get_supabase_uid('tag_owner')
);

-- create a tag taker
SELECT tests.create_supabase_user('tag_taker');

SELECT tests.authenticate_as('tag_taker');

SET ROLE TO postgres;

-- verify the tag taker address
INSERT INTO chain_addresses (address, user_id)
VALUES (
    '0xfB00d9CDA6DaD99994849d7C66Fa2631f280F64f',
    tests.get_supabase_uid('tag_taker')
);

SELECT tests.authenticate_as('tag_taker');

SELECT throws_ok(
    $test$
    INSERT INTO tags(name, user_id)
    VALUES (
        'reservation',
        tests.get_supabase_uid('tag_taker')
      ) $test$,
    'You don''t got the riz for the tag: reservation',
    'User cannot reserve a tag that is on the reserverations with a different address'
);

SELECT throws_ok(
    $test$
    INSERT INTO tags(name, user_id)
    VALUES (
        'reservation2',
        tests.get_supabase_uid('tag_taker')
      ) $test$,
    'You don''t got the riz for the tag: reservation2',
    'User cannot reserve a tag that is on the reserverations with a NULL address'
);

-- tag owner can reserve a tag that is on the reserverations with the same verified address
SELECT tests.authenticate_as('tag_owner');

INSERT INTO tags (name, user_id)
VALUES (
    'reservation',
    tests.get_supabase_uid('tag_owner')
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

SELECT confirm_tags(
    '{reservation}',
    '0x1234567890123456789012345678901234567890123456789012345678901234',
    NULL
);

SET role TO postgres;

-- tag should be confirmed
SELECT tests.authenticate_as('tag_owner');

SELECT isnt_empty(
    $test$
    SELECT *
    FROM tags
    WHERE name = 'reservation' $test$,
    'Tag should be confirmed'
);

SELECT finish();

ROLLBACK;
