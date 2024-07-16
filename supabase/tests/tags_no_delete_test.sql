-- 5. Tag Deletion
BEGIN;

SELECT plan(1);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Creating a test user
SELECT tests.create_supabase_user('bob');
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
SELECT tests.authenticate_as('bob');

-- Inserting a tag for test user
INSERT INTO tags (name)
VALUES ('bob');

-- confirm tag
SET ROLE service_role;

SELECT confirm_tags(
    '{bob}',
    (
        SELECT event_id
        FROM send_account_transfers
        WHERE f = '\xb0b0000000000000000000000000000000000000'
    ),
    null
);

-- Deleting the tag
SET ROLE postgres;

SELECT tests.authenticate_as('bob');

-- Trying to delete the tag is a NOOP
DELETE FROM tags
WHERE name = 'bob';

SELECT results_eq(
    'SELECT COUNT(*)::integer FROM tags WHERE name = ''bob''',
    $$VALUES (1) $$,
    'User should not be able to delete a tag'
);

SELECT finish();

ROLLBACK;
