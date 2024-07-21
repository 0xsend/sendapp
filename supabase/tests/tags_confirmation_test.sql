-- 3. Tag Confirmation
BEGIN;

SELECT plan(10);

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
from send_account_transfers
where f = _f into _id; return _id;
end;
$$;

-- Creating test users
SELECT tests.create_supabase_user('bob');
SELECT tests.create_supabase_user('alice');
SELECT tests.create_supabase_user('hacker');

SELECT set_config('role', 'service_role', true);

-- Create some send_account_transfers
INSERT INTO send_account_transfers (
    chain_id,
    log_addr,
    tx_hash,
    f,
    t,
    v,
    ig_name,
    src_name,
    block_num,
    tx_idx,
    log_idx,
    abi_idx,
    block_time
)
VALUES (
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    '\xb0b0000000000000000000000000000000000000',
    '\xfC1e51BBae1C1Ee9e6Cc629ea0023329EA5023a6',
    4,
    'send_account_transfers',
    'send_account_transfers',
    1,
    0,
    0,
    0,
    1234567890
),
(
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    '\xa71ce00000000000000000000000000000000000',
    '\xfC1e51BBae1C1Ee9e6Cc629ea0023329EA5023a6',
    1,
    'send_account_transfers',
    'send_account_transfers',
    1,
    0,
    1,
    0,
    1234567890
),
(
    8453,
    '\x5afe000000000000000000000000000000000000',
    '\x1234567890123456789012345678901234567890123456789012345678901234',
    '\xc401e00000000000000000000000000000000000',
    '\xfC1e51BBae1C1Ee9e6Cc629ea0023329EA5023a6',
    1,
    'send_account_transfers',
    'send_account_transfers',
    3,
    0,
    0,
    0,
    1234567890
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

-- Inserting tags for test user
INSERT INTO tags (name, user_id)
VALUES 
    ('bob', tests.get_supabase_uid('bob')),
    ('bob_2', tests.get_supabase_uid('bob')),
    ('bob_3', tests.get_supabase_uid('bob')),
    ('bob_4', tests.get_supabase_uid('bob'));

-- Confirm tags with the service role
SELECT tests.clear_authentication();
SELECT set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{bob,bob_2,bob_3,bob_4}',
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

-- Inserting a tag for Alice
INSERT INTO tags (name, user_id)
VALUES ('alice', tests.get_supabase_uid('alice'));

-- Confirm tags with the service role
SELECT tests.clear_authentication();
SELECT set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{alice}',
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
INSERT INTO tags (name, user_id)
VALUES ('hacker', tests.get_supabase_uid('hacker'));

SELECT tests.clear_authentication();
SELECT set_config('role', 'service_role', true);

SELECT throws_ok(
    $$
    SELECT confirm_tags('{hacker}', (
        _event_id('\xa71ce00000000000000000000000000000000000')
    ), null);
    $$,
    'Receipt event ID does not match the sender'
);

-- Alice attempts to reuse her receipt
SELECT tests.authenticate_as('alice');

INSERT INTO tags (name, user_id)
VALUES ('queenofhacking', tests.get_supabase_uid('alice'));

SELECT tests.clear_authentication();
SELECT set_config('role', 'service_role', true);

SELECT throws_ok(
    $$
    SELECT confirm_tags('{queenofhacking}', (
        _event_id('\xa71ce00000000000000000000000000000000000')
    ), null);
    $$,
    'duplicate key value violates unique constraint "receipts_event_id_idx"'
);

-- Test confirm_tags throws when no sendtag checkout contracts are found
delete from sendtag_checkout_contracts;
SELECT throws_ok(
    $$
    SELECT confirm_tags('{queenofhacking}', (
        _event_id('\xa71ce00000000000000000000000000000000000')
    ), null);
    $$,
    'Sendtag checkout contract not found.'
);

SELECT finish();

ROLLBACK;
