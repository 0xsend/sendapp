-- 5. Tag Deletion
BEGIN;

SELECT plan(3);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Creating a test user
SELECT tests.create_supabase_user('boss');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('boss'),
    '0xb055000000000000000000000000000000000000',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

INSERT INTO sendtag_checkout_receipts (
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
    reward
)
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
    '\xb055000000000000000000000000000000000000',
    1,
    '\x0000000000000000000000000000000000000000',
    0
);

SELECT tests.authenticate_as('boss');

-- Create a tag using the proper function
SELECT create_tag('test_tag', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('boss')));

-- User can change the name of a pending tag
UPDATE tags
SET name = 'test_tag2'
WHERE name = 'test_tag';

SELECT results_eq(
    $$SELECT COUNT(*)::integer
    FROM tags
    WHERE name = 'test_tag2' $$,
    $$VALUES (1) $$,
    'User should be able to change the name of a pending tag'
);

SET ROLE service_role;

-- confirm tag
SELECT confirm_tags(
    '{test_tag2}'::citext[],
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('boss')),
    (
        SELECT event_id
        FROM sendtag_checkout_receipts
        WHERE sender = '\xb055000000000000000000000000000000000000'
    ),
    null
);

-- Users cannot update a confirmed tag
SET ROLE postgres;

SELECT tests.authenticate_as('boss');

SELECT throws_ok(
    $$UPDATE tags
    set name = 'test_tag3'
    where name = 'test_tag2';

$$,
    'Users cannot change the name of a confirmed tag',
    'Users cannot change the name of a confirmed tag'
);

-- not even service role can update a confirmed tag
SET ROLE service_role;

SELECT throws_ok(
    $$UPDATE tags
    set name = 'test_tag3'
    where name = 'test_tag2';

$$,
    'update or delete on table "tags" violates foreign key constraint "tag_receipts_tag_name_fkey" on table "tag_receipts"',
    'Service role should not be able to change the name of a confirmed tag'
);

SELECT finish();

ROLLBACK;
