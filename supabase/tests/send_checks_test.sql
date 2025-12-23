BEGIN;
SELECT plan(39);

CREATE EXTENSION "basejump-supabase_test_helpers";

-- Switch to service_role for test setup
SELECT set_config('role', 'service_role', TRUE);

-- Create test users
SELECT tests.create_supabase_user('sender_user');
SELECT tests.create_supabase_user('redeemer_user');

-- Use unique test addresses to avoid conflicts with existing data
-- Using 0xCCCC prefix to make them unique to this test

-- ============================================================================
-- TEST: Table structure for send_check_created
-- ============================================================================
SELECT has_table('public', 'send_check_created', 'send_check_created table exists');
SELECT has_column('public', 'send_check_created', 'ephemeral_address', 'has ephemeral_address column');
SELECT has_column('public', 'send_check_created', 'sender', 'has sender column');
SELECT has_column('public', 'send_check_created', 'token', 'has token column');
SELECT has_column('public', 'send_check_created', 'amount', 'has amount column');
SELECT has_column('public', 'send_check_created', 'expires_at', 'has expires_at column');

-- ============================================================================
-- TEST: Table structure for send_check_claimed
-- ============================================================================
SELECT has_table('public', 'send_check_claimed', 'send_check_claimed table exists');
SELECT has_column('public', 'send_check_claimed', 'redeemer', 'has redeemer column');

-- ============================================================================
-- TEST: Table structure for send_check_notes
-- ============================================================================
SELECT has_table('public', 'send_check_notes', 'send_check_notes table exists');
SELECT has_column('public', 'send_check_notes', 'ephemeral_address', 'has ephemeral_address column');
SELECT has_column('public', 'send_check_notes', 'chain_id', 'has chain_id column');
SELECT has_column('public', 'send_check_notes', 'note', 'has note column');

-- ============================================================================
-- TEST: Insert test data for send_check_created
-- ============================================================================

-- Check 1: Active check (expires in the future)
INSERT INTO send_check_created(
    chain_id, log_addr, block_time, tx_hash, tx_idx,
    ephemeral_address, sender, token, amount, expires_at,
    ig_name, src_name, block_num, log_idx, abi_idx)
VALUES (
    8453,
    '\xCCCC567890123456789012345678901234567890',
    EXTRACT(EPOCH FROM NOW() - interval '1 hour'),
    '\xCCCC111111111111111111111111111111111111111111111111111111111111',
    0,
    '\xCCCC000000000000000000000000000000000001',
    '\xCCCC000000000000000000000000000000000ABC',
    '\x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    1000000, -- 1 USDC
    EXTRACT(EPOCH FROM NOW() + interval '1 day'),
    'send_checks_test', 'send_checks_test',
    100000, 0, 0);

-- Check 2: Expired unclaimed check
INSERT INTO send_check_created(
    chain_id, log_addr, block_time, tx_hash, tx_idx,
    ephemeral_address, sender, token, amount, expires_at,
    ig_name, src_name, block_num, log_idx, abi_idx)
VALUES (
    8453,
    '\xCCCC567890123456789012345678901234567890',
    EXTRACT(EPOCH FROM NOW() - interval '2 days'),
    '\xCCCC222222222222222222222222222222222222222222222222222222222222',
    0,
    '\xCCCC000000000000000000000000000000000002',
    '\xCCCC000000000000000000000000000000000ABC',
    '\x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    2000000, -- 2 USDC
    EXTRACT(EPOCH FROM NOW() - interval '1 day'), -- expired
    'send_checks_test', 'send_checks_test',
    100001, 0, 0);

-- Check 3: Check that will be claimed (multi-token check with two tokens)
INSERT INTO send_check_created(
    chain_id, log_addr, block_time, tx_hash, tx_idx,
    ephemeral_address, sender, token, amount, expires_at,
    ig_name, src_name, block_num, log_idx, abi_idx)
VALUES
(
    8453,
    '\xCCCC567890123456789012345678901234567890',
    EXTRACT(EPOCH FROM NOW() - interval '30 minutes'),
    '\xCCCC333333333333333333333333333333333333333333333333333333333333',
    0,
    '\xCCCC000000000000000000000000000000000003',
    '\xCCCC000000000000000000000000000000000ABC',
    '\x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', -- USDC
    5000000, -- 5 USDC
    EXTRACT(EPOCH FROM NOW() + interval '2 days'),
    'send_checks_test', 'send_checks_test',
    100002, 0, 0),
(
    8453,
    '\xCCCC567890123456789012345678901234567890',
    EXTRACT(EPOCH FROM NOW() - interval '30 minutes'),
    '\xCCCC333333333333333333333333333333333333333333333333333333333333',
    0,
    '\xCCCC000000000000000000000000000000000003',
    '\xCCCC000000000000000000000000000000000ABC',
    '\xEab49138ba2Ea6Dd776220fE26b7b8E446638956', -- SEND
    100000000000000000000, -- 100 SEND
    EXTRACT(EPOCH FROM NOW() + interval '2 days'),
    'send_checks_test', 'send_checks_test',
    100002, 0, 1); -- abi_idx = 1 for second token

-- Check 4: Canceled check (claimed by sender themselves)
INSERT INTO send_check_created(
    chain_id, log_addr, block_time, tx_hash, tx_idx,
    ephemeral_address, sender, token, amount, expires_at,
    ig_name, src_name, block_num, log_idx, abi_idx)
VALUES (
    8453,
    '\xCCCC567890123456789012345678901234567890',
    EXTRACT(EPOCH FROM NOW() - interval '2 hours'),
    '\xCCCC444444444444444444444444444444444444444444444444444444444444',
    0,
    '\xCCCC000000000000000000000000000000000004',
    '\xCCCC000000000000000000000000000000000ABC',
    '\x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    3000000, -- 3 USDC
    EXTRACT(EPOCH FROM NOW() + interval '1 day'),
    'send_checks_test', 'send_checks_test',
    100003, 0, 0);

-- Claim check 3 (both tokens) - claimed by different address (redeemer)
INSERT INTO send_check_claimed(
    chain_id, log_addr, block_time, tx_hash, tx_idx,
    ephemeral_address, sender, token, amount, expires_at, redeemer,
    ig_name, src_name, block_num, log_idx, abi_idx)
VALUES
(
    8453,
    '\xCCCC567890123456789012345678901234567890',
    EXTRACT(EPOCH FROM NOW()),
    '\xCCCC555555555555555555555555555555555555555555555555555555555555',
    0,
    '\xCCCC000000000000000000000000000000000003',
    '\xCCCC000000000000000000000000000000000ABC',
    '\x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    5000000,
    EXTRACT(EPOCH FROM NOW() + interval '2 days'),
    '\xCCCC000000000000000000000000000000000DEF', -- redeemer is different from sender
    'send_checks_test', 'send_checks_test',
    100004, 0, 0),
(
    8453,
    '\xCCCC567890123456789012345678901234567890',
    EXTRACT(EPOCH FROM NOW()),
    '\xCCCC555555555555555555555555555555555555555555555555555555555555',
    0,
    '\xCCCC000000000000000000000000000000000003',
    '\xCCCC000000000000000000000000000000000ABC',
    '\xEab49138ba2Ea6Dd776220fE26b7b8E446638956',
    100000000000000000000,
    EXTRACT(EPOCH FROM NOW() + interval '2 days'),
    '\xCCCC000000000000000000000000000000000DEF',
    'send_checks_test', 'send_checks_test',
    100004, 0, 1);

-- Claim check 4 - canceled by sender (redeemer = sender)
INSERT INTO send_check_claimed(
    chain_id, log_addr, block_time, tx_hash, tx_idx,
    ephemeral_address, sender, token, amount, expires_at, redeemer,
    ig_name, src_name, block_num, log_idx, abi_idx)
VALUES (
    8453,
    '\xCCCC567890123456789012345678901234567890',
    EXTRACT(EPOCH FROM NOW()),
    '\xCCCC666666666666666666666666666666666666666666666666666666666666',
    0,
    '\xCCCC000000000000000000000000000000000004',
    '\xCCCC000000000000000000000000000000000ABC',
    '\x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    3000000,
    EXTRACT(EPOCH FROM NOW() + interval '1 day'),
    '\xCCCC000000000000000000000000000000000ABC', -- redeemer = sender (canceled)
    'send_checks_test', 'send_checks_test',
    100005, 0, 0);

-- ============================================================================
-- TEST: Insert test notes for send_check_notes
-- ============================================================================

-- Note for active check (Check 1)
INSERT INTO send_check_notes(ephemeral_address, chain_id, note)
VALUES (
    '\xCCCC000000000000000000000000000000000001',
    8453,
    'Happy Birthday!'
);

-- Note for claimed check (Check 3)
INSERT INTO send_check_notes(ephemeral_address, chain_id, note)
VALUES (
    '\xCCCC000000000000000000000000000000000003',
    8453,
    'Thanks for lunch!'
);

-- ============================================================================
-- TEST: get_check_by_ephemeral_address function - Active check
-- ============================================================================
SELECT results_eq(
    $$
        SELECT
            is_active,
            is_claimed,
            is_expired,
            is_canceled
        FROM get_check_by_ephemeral_address(
            '\xCCCC000000000000000000000000000000000001'::bytea,
            8453::numeric
        )
    $$,
    $$VALUES (true, false, false, false)$$,
    'get_check_by_ephemeral_address returns correct status for active unclaimed check'
);

-- ============================================================================
-- TEST: get_check_by_ephemeral_address function - Expired unclaimed check
-- ============================================================================
SELECT results_eq(
    $$
        SELECT
            is_active,
            is_claimed,
            is_expired,
            is_canceled
        FROM get_check_by_ephemeral_address(
            '\xCCCC000000000000000000000000000000000002'::bytea,
            8453::numeric
        )
    $$,
    $$VALUES (false, false, true, false)$$,
    'get_check_by_ephemeral_address returns correct status for expired unclaimed check'
);

-- ============================================================================
-- TEST: get_check_by_ephemeral_address function - Claimed check
-- ============================================================================
SELECT results_eq(
    $$
        SELECT
            is_active,
            is_claimed,
            is_expired,
            is_canceled,
            claimed_by
        FROM get_check_by_ephemeral_address(
            '\xCCCC000000000000000000000000000000000003'::bytea,
            8453::numeric
        )
    $$,
    $$VALUES (
        false,
        true,
        false,
        false,
        '\xCCCC000000000000000000000000000000000DEF'::bytea
    )$$,
    'get_check_by_ephemeral_address returns correct status for claimed check'
);

-- ============================================================================
-- TEST: get_check_by_ephemeral_address function - Multi-token aggregation (count)
-- ============================================================================
SELECT results_eq(
    $$
        SELECT
            array_length(tokens, 1),
            array_length(amounts, 1)
        FROM get_check_by_ephemeral_address(
            '\xCCCC000000000000000000000000000000000003'::bytea,
            8453::numeric
        )
    $$,
    $$VALUES (2, 2)$$,
    'get_check_by_ephemeral_address returns correct number of tokens'
);

-- ============================================================================
-- TEST: get_check_by_ephemeral_address function - Multi-token values ordered by abi_idx
-- ============================================================================
SELECT results_eq(
    $$
        SELECT
            tokens,
            amounts
        FROM get_check_by_ephemeral_address(
            '\xCCCC000000000000000000000000000000000003'::bytea,
            8453::numeric
        )
    $$,
    $$VALUES (
        ARRAY[
            '\x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'::bytea,  -- USDC (abi_idx=0)
            '\xEab49138ba2Ea6Dd776220fE26b7b8E446638956'::bytea   -- SEND (abi_idx=1)
        ],
        ARRAY[
            5000000::numeric,              -- 5 USDC
            100000000000000000000::numeric -- 100 SEND
        ]
    )$$,
    'get_check_by_ephemeral_address returns correct token addresses and amounts ordered by abi_idx'
);

-- ============================================================================
-- TEST: get_check_by_ephemeral_address function - Canceled check (redeemer = sender)
-- ============================================================================
SELECT results_eq(
    $$
        SELECT
            is_active,
            is_claimed,
            is_expired,
            is_canceled
        FROM get_check_by_ephemeral_address(
            '\xCCCC000000000000000000000000000000000004'::bytea,
            8453::numeric
        )
    $$,
    $$VALUES (false, true, false, true)$$,
    'get_check_by_ephemeral_address returns is_canceled=true when redeemer equals sender'
);

-- ============================================================================
-- TEST: get_user_checks function - Returns all checks for sender
-- ============================================================================
SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM get_user_checks('\xCCCC000000000000000000000000000000000ABC'::bytea)
    $$,
    $$VALUES (4)$$,
    'get_user_checks returns all checks for the sender'
);

-- ============================================================================
-- TEST: get_user_checks function - Ordering (active first, then expired unclaimed, then by block_time)
-- ============================================================================
SELECT results_eq(
    $$
        SELECT ephemeral_address
        FROM get_user_checks('\xCCCC000000000000000000000000000000000ABC'::bytea)
        LIMIT 1
    $$,
    $$VALUES ('\xCCCC000000000000000000000000000000000001'::bytea)$$,
    'get_user_checks returns active checks first'
);

-- ============================================================================
-- TEST: get_user_checks function - Pagination
-- ============================================================================
SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM get_user_checks(
            '\xCCCC000000000000000000000000000000000ABC'::bytea,
            2,  -- page_limit
            0   -- page_offset
        )
    $$,
    $$VALUES (2)$$,
    'get_user_checks respects page_limit'
);

SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM get_user_checks(
            '\xCCCC000000000000000000000000000000000ABC'::bytea,
            50, -- page_limit
            2   -- page_offset
        )
    $$,
    $$VALUES (2)$$,
    'get_user_checks respects page_offset'
);

-- ============================================================================
-- TEST: get_user_checks function - is_sender is true for sender
-- ============================================================================
SELECT results_eq(
    $$
        SELECT DISTINCT is_sender
        FROM get_user_checks('\xCCCC000000000000000000000000000000000ABC'::bytea)
    $$,
    $$VALUES (true)$$,
    'get_user_checks returns is_sender=true for all checks when queried by sender'
);

-- ============================================================================
-- TEST: get_user_checks function - Receiver sees claimed checks with is_sender=false
-- ============================================================================
SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM get_user_checks('\xCCCC000000000000000000000000000000000DEF'::bytea)
    $$,
    $$VALUES (1)$$,
    'get_user_checks returns claimed checks for receiver'
);

SELECT results_eq(
    $$
        SELECT is_sender, is_claimed
        FROM get_user_checks('\xCCCC000000000000000000000000000000000DEF'::bytea)
    $$,
    $$VALUES (false, true)$$,
    'get_user_checks returns is_sender=false and is_claimed=true for receiver'
);

-- ============================================================================
-- TEST: get_user_checks function - Sender still sees claimed check with is_sender=true
-- ============================================================================
SELECT results_eq(
    $$
        SELECT is_sender, is_claimed, claimed_by
        FROM get_user_checks('\xCCCC000000000000000000000000000000000ABC'::bytea)
        WHERE ephemeral_address = '\xCCCC000000000000000000000000000000000003'::bytea
    $$,
    $$VALUES (true, true, '\xCCCC000000000000000000000000000000000DEF'::bytea)$$,
    'get_user_checks returns is_sender=true for sender even when check is claimed by someone else'
);

-- ============================================================================
-- TEST: get_user_checks function - Canceled check not shown to sender as receiver
-- ============================================================================
SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM get_user_checks('\xCCCC000000000000000000000000000000000ABC'::bytea)
        WHERE is_sender = false
    $$,
    $$VALUES (0)$$,
    'get_user_checks does not return canceled checks as received (is_sender=false)'
);

-- ============================================================================
-- TEST: RLS - Authenticated users can read send_check_created (test specific records)
-- ============================================================================
SELECT tests.authenticate_as('sender_user');

SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM send_check_created
        WHERE ig_name = 'send_checks_test'
    $$,
    $$VALUES (5)$$,
    'Authenticated users can read send_check_created test records'
);

-- ============================================================================
-- TEST: RLS - Authenticated users can read send_check_claimed (test specific records)
-- ============================================================================
SELECT results_eq(
    $$
        SELECT COUNT(*)::integer
        FROM send_check_claimed
        WHERE ig_name = 'send_checks_test'
    $$,
    $$VALUES (3)$$,
    'Authenticated users can read send_check_claimed test records'
);

-- ============================================================================
-- TEST: get_check_by_ephemeral_address function - Returns note for check with note
-- ============================================================================
SELECT tests.clear_authentication();
SELECT set_config('role', 'service_role', TRUE);

SELECT results_eq(
    $$
        SELECT note
        FROM get_check_by_ephemeral_address(
            '\xCCCC000000000000000000000000000000000001'::bytea,
            8453::numeric
        )
    $$,
    $$VALUES ('Happy Birthday!'::text)$$,
    'get_check_by_ephemeral_address returns note for check with note'
);

-- ============================================================================
-- TEST: get_check_by_ephemeral_address function - Returns NULL note for check without note
-- ============================================================================
SELECT results_eq(
    $$
        SELECT note
        FROM get_check_by_ephemeral_address(
            '\xCCCC000000000000000000000000000000000002'::bytea,
            8453::numeric
        )
    $$,
    $$VALUES (NULL::text)$$,
    'get_check_by_ephemeral_address returns NULL note for check without note'
);

-- ============================================================================
-- TEST: get_user_checks function - Returns note for sender's check
-- ============================================================================
SELECT results_eq(
    $$
        SELECT note
        FROM get_user_checks('\xCCCC000000000000000000000000000000000ABC'::bytea)
        WHERE ephemeral_address = '\xCCCC000000000000000000000000000000000001'::bytea
    $$,
    $$VALUES ('Happy Birthday!'::text)$$,
    'get_user_checks returns note for sender check with note'
);

-- ============================================================================
-- TEST: get_user_checks function - Returns note for receiver's claimed check
-- ============================================================================
SELECT results_eq(
    $$
        SELECT note
        FROM get_user_checks('\xCCCC000000000000000000000000000000000DEF'::bytea)
    $$,
    $$VALUES ('Thanks for lunch!'::text)$$,
    'get_user_checks returns note for receiver on claimed check'
);

-- ============================================================================
-- TEST: RLS - Setup send_accounts for sender and receiver users
-- ============================================================================
SELECT tests.clear_authentication();
SELECT set_config('role', 'service_role', TRUE);

-- Create send_account for sender_user linked to the test sender address
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('sender_user'),
    '0xCCCC000000000000000000000000000000000ABC',
    8453,
    '\x00'
);

-- Create send_account for redeemer_user linked to the test redeemer address
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
VALUES (
    tests.get_supabase_uid('redeemer_user'),
    '0xCCCC000000000000000000000000000000000DEF',
    8453,
    '\x00'
);

-- ============================================================================
-- TEST: RLS - Sender can read their own notes
-- ============================================================================
SELECT tests.authenticate_as('sender_user');

SELECT results_eq(
    $$
        SELECT COUNT(*)::integer FROM send_check_notes
        WHERE ephemeral_address IN (
            '\xCCCC000000000000000000000000000000000001'::bytea,
            '\xCCCC000000000000000000000000000000000003'::bytea
        )
    $$,
    $$VALUES (2)$$,
    'Sender can read notes for their own checks'
);

-- ============================================================================
-- TEST: RLS - Receiver can read notes for claimed checks
-- ============================================================================
SELECT tests.authenticate_as('redeemer_user');

-- Redeemer claimed check 3, so they should be able to read its note
SELECT results_eq(
    $$
        SELECT note FROM send_check_notes
        WHERE ephemeral_address = '\xCCCC000000000000000000000000000000000003'::bytea
    $$,
    $$VALUES ('Thanks for lunch!'::text)$$,
    'Receiver can read note for claimed check'
);

-- ============================================================================
-- TEST: RLS - Receiver cannot read notes for unclaimed checks
-- ============================================================================
-- Redeemer should NOT be able to read note for check 1 (not claimed by them)
SELECT results_eq(
    $$
        SELECT COUNT(*)::integer FROM send_check_notes
        WHERE ephemeral_address = '\xCCCC000000000000000000000000000000000001'::bytea
    $$,
    $$VALUES (0)$$,
    'Receiver cannot read notes for checks they have not claimed'
);

-- ============================================================================
-- TEST: RLS - Unrelated user cannot read any notes
-- ============================================================================
SELECT tests.create_supabase_user('unrelated_user');
SELECT tests.authenticate_as('unrelated_user');

SELECT results_eq(
    $$
        SELECT COUNT(*)::integer FROM send_check_notes
    $$,
    $$VALUES (0)$$,
    'Unrelated user cannot read any notes'
);

-- ============================================================================
-- TEST: RLS - Sender can insert note for their own check
-- ============================================================================
SELECT tests.authenticate_as('sender_user');

-- Sender should be able to insert a note for check 2 (expired unclaimed - no note yet)
SELECT lives_ok(
    $$
        INSERT INTO send_check_notes(ephemeral_address, chain_id, note)
        VALUES (
            '\xCCCC000000000000000000000000000000000002',
            8453,
            'Test note from sender'
        )
    $$,
    'Sender can insert note for their own check'
);

-- ============================================================================
-- TEST: RLS - Non-sender cannot insert note for someone else's check
-- ============================================================================
SELECT tests.authenticate_as('redeemer_user');

SELECT throws_ok(
    $$
        INSERT INTO send_check_notes(ephemeral_address, chain_id, note)
        VALUES (
            '\xCCCC000000000000000000000000000000000004',
            8453,
            'Unauthorized note'
        )
    $$,
    'new row violates row-level security policy for table "send_check_notes"',
    'Non-sender cannot insert note for someone else check'
);

SELECT finish();
ROLLBACK;
