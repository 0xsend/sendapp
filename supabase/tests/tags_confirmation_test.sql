-- 3. Tag Confirmation
BEGIN;

SELECT plan(9);

CREATE EXTENSION "basejump-supabase_test_helpers"; -- noqa: RF05

GRANT USAGE ON SCHEMA tests TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO service_role;

CREATE FUNCTION _event_id(_f bytea) RETURNS text
LANGUAGE plpgsql
AS $$
declare
    _id text;
begin
select event_id
from sendtag_checkout_receipts
where sender = _f into _id; return _id;
end;
$$;

-- Creating test users
SELECT tests.create_supabase_user('bob');
SELECT tests.create_supabase_user('alice');
SELECT tests.create_supabase_user('hacker');

-- Clean up any existing tags from previous test runs to avoid conflicts
DELETE FROM send_account_tags WHERE tag_id IN (
    SELECT id FROM tags WHERE name IN ('bob', 'bob_2', 'bob_3', 'bob_4', 'alice', 'hacker', 'queenofhacking')
);
DELETE FROM tags WHERE name IN ('bob', 'bob_2', 'bob_3', 'bob_4', 'alice', 'hacker', 'queenofhacking');

SELECT set_config('role', 'service_role', true);

-- Create some sendtag_checkout_receipts
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
    '\xb0b0000000000000000000000000000000000000',
    4,
    '\x0000000000000000000000000000000000000000',
    0
),
(
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    'sendtag_checkout_receipts',
    'sendtag_checkout_receipts',
    1,
    0,
    1,
    0,
    1234567890,
    '\xa71ce00000000000000000000000000000000000',
    1,
    '\x0000000000000000000000000000000000000000',
    0
),
(
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    'sendtag_checkout_receipts',
    'sendtag_checkout_receipts',
    3,
    0,
    0,
    0,
    1234567890,
    '\xc401e00000000000000000000000000000000000',
    1,
    '\x0000000000000000000000000000000000000000',
    0
);

-- Bob can register and confirm tags with valid transfers
SELECT tests.authenticate_as('bob');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('bob'),
    '0xb0b0000000000000000000000000000000000000', -- matches sender
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- Creating tags for test user using create_tag function
SELECT create_tag('bob', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('bob')));
SELECT create_tag('bob_2', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('bob')));
SELECT create_tag('bob_3', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('bob')));
SELECT create_tag('bob_4', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('bob')));

-- Confirm tags with the service role
SELECT tests.clear_authentication();
SELECT set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{bob,bob_2,bob_3,bob_4}'::citext[],
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('bob')),
    _event_id('\xb0b0000000000000000000000000000000000000'),
    null
);

-- Verify that the tags were confirmed
SELECT results_eq(
    $$
    SELECT count(*)::integer
    FROM tags
    WHERE status = 'confirmed'::tag_status
    AND user_id = tests.get_supabase_uid('bob')
    $$,
    $$VALUES (4)$$,
    'Tags should be confirmed'
);

-- Verify receipt was created
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    FROM receipts
    WHERE event_id = _event_id('\xb0b0000000000000000000000000000000000000')
    $$,
    $$VALUES (1)$$,
    'Receipt should be created'
);

SELECT tests.authenticate_as('bob');

-- Verify activity was created
SELECT results_eq(
    $$
    SELECT jsonb_agg(tag ORDER BY tag)::text, 
    tx_hash, 
    value,
    block_num,
    tx_idx,
    log_idx
    FROM (
        SELECT jsonb_array_elements_text(data->'tags') AS tag,
        data->>'tx_hash' as tx_hash, 
        data->>'value' as value,
        data->>'block_num' as block_num,
        data->>'tx_idx' as tx_idx,
        data->>'log_idx' as log_idx
        FROM activity_feed
        WHERE event_name = 'tag_receipt_usdc'
    ) subquery
    GROUP BY tx_hash, value, block_num, tx_idx, log_idx
    $$,
    $$VALUES (
        '["bob", "bob_2", "bob_3", "bob_4"]'::text,
        '\x1234567890123456789012345678901234567890123456789012345678901234',
        4::text,
        1::text,
        0::text,
        0::text
    )$$,
    'Tag receipt activity was created'
);

-- Now confirm for Alice
SELECT tests.authenticate_as('alice');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('alice'),
    '0xa71CE00000000000000000000000000000000000',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- Creating a tag for Alice using create_tag function
SELECT create_tag('alice', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('alice')));

-- Confirm tags with the service role
SELECT tests.clear_authentication();
SELECT set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{alice}'::citext[],
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('alice')),
    _event_id('\xa71ce00000000000000000000000000000000000'),
    null
);

-- Verify that the tags were confirmed for Alice
SELECT results_eq(
    $$
    SELECT count(*)::integer
    FROM tags
    WHERE status = 'confirmed'::tag_status
    AND user_id = tests.get_supabase_uid('alice')
    $$,
    $$VALUES (1)$$,
    'Tags for Alice should be confirmed'
);

-- Verify receipt was created for Alice
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    FROM receipts
    WHERE event_id = _event_id('\xa71ce00000000000000000000000000000000000')
    $$,
    $$VALUES (1)$$,
    'Receipt should be created for Alice'
);

SELECT tests.authenticate_as('alice');

-- Verify activity was created for Alice
SELECT results_eq(
    $$
    SELECT jsonb_agg(tag ORDER BY tag)::text, 
    tx_hash, 
    value,
    block_num,
    tx_idx,
    log_idx
    FROM (
        SELECT jsonb_array_elements_text(data->'tags') AS tag, 
        data->>'tx_hash' as tx_hash, 
        data->>'value' as value,
        data->>'block_num' as block_num,
        data->>'tx_idx' as tx_idx,
        data->>'log_idx' as log_idx
        FROM activity_feed
        WHERE event_name = 'tag_receipt_usdc'
    ) subquery
    GROUP BY tx_hash, value, block_num, tx_idx, log_idx
    $$,
    $$VALUES (
        '["alice"]'::text,
        '\x1234567890123456789012345678901234567890123456789012345678901234',
        1::text,
        1::text,
        0::text,
        1::text
    )$$,
    'Tag receipt activity was created for Alice'
);

SELECT tests.authenticate_as('hacker');

-- Verify hacker cannot see tag receipt
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    FROM tag_receipts
    WHERE tag_name = 'alice'
    $$,
    $$VALUES (0)$$,
    'Hacker should not be able to see tag receipt'
);

-- Attempt to use duplicate receipt hash to confirm tag
-- First create send account for hacker
INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('hacker'),
    '0xc401E00000000000000000000000000000000000',
    1,
    '\\x00112233445566778899AABBCCDDEEFF'
);

-- Create tag for hacker using create_tag function
SELECT create_tag('hacker', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('hacker')));

SELECT tests.clear_authentication();
SELECT set_config('role', 'service_role', true);

SELECT throws_ok(
    $$
    SELECT confirm_tags(
        '{hacker}'::citext[], 
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('hacker')),
        _event_id('\xa71ce00000000000000000000000000000000000'),
        null
    );
    $$,
    'Receipt event ID does not match the sender'
);

-- Alice attempts to reuse her receipt
SELECT tests.authenticate_as('alice');

-- Create another tag for Alice using create_tag function
SELECT create_tag('queenofhacking', (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('alice')));

SELECT tests.clear_authentication();
SELECT set_config('role', 'service_role', true);

SELECT throws_ok(
    $$
    SELECT confirm_tags(
        '{queenofhacking}'::citext[], 
        (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('alice')),
        _event_id('\xa71ce00000000000000000000000000000000000'),
        null
    );
    $$,
    'duplicate key value violates unique constraint "receipts_event_id_idx"'
);

SELECT finish();

ROLLBACK;
