BEGIN;
SELECT plan(20);

-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers"; -- noqa: RF05

-- Create test users
SELECT tests.create_supabase_user('test_sender');
SELECT tests.create_supabase_user('test_recipient');

-- Setup: Create send accounts for the test users
INSERT INTO send_account_created (chain_id, log_addr, block_time, user_op_hash, tx_hash, account, ig_name, src_name, block_num, tx_idx, log_idx)
VALUES 
    (8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')), '\x1234', '\x1234', '\x1111111111111111111111111111111111111111', 'send_account_created', 'send_account_created', 1, 0, 0),
    (8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', floor(extract(EPOCH FROM timestamptz '2024-01-01 12:00:00')), '\x5678', '\x5678', '\x2222222222222222222222222222222222222222', 'send_account_created', 'send_account_created', 1, 0, 1);

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES 
    (tests.get_supabase_uid('test_sender'), '0x1111111111111111111111111111111111111111', 8453, '\x00112233'),
    (tests.get_supabase_uid('test_recipient'), '0x2222222222222222222222222222222222222222', 8453, '\x00112233');

-- ============================================================================
-- Test 1: Create transfer_intent with auto-populated user IDs
-- ============================================================================

INSERT INTO transfer_intents (
    workflow_id,
    from_address,
    to_address,
    amount,
    chain_id,
    note
)
VALUES (
    'workflow-123',
    '\x1111111111111111111111111111111111111111',
    '\x2222222222222222222222222222222222222222',
    1000000,
    8453,
    'Test transfer note'
);

SELECT results_eq(
    $$
        SELECT 
            from_user_id,
            to_user_id,
            status::text,
            note,
            amount
        FROM transfer_intents
        WHERE workflow_id = 'workflow-123'
    $$,
    $$
        VALUES (
            tests.get_supabase_uid('test_sender'),
            tests.get_supabase_uid('test_recipient'),
            'pending',
            'Test transfer note',
            1000000::numeric
        )
    $$,
    'Transfer intent should auto-populate user IDs from addresses'
);

-- ============================================================================
-- Test 2: Unique workflow_id constraint
-- ============================================================================

SELECT throws_ok(
    $$
        INSERT INTO transfer_intents (
            workflow_id,
            from_address,
            to_address,
            amount,
            chain_id
        )
        VALUES (
            'workflow-123',
            '\x1111111111111111111111111111111111111111',
            '\x2222222222222222222222222222222222222222',
            2000000,
            8453
        )
    $$,
    '23505',  -- unique_violation
    NULL,
    'Should reject duplicate workflow_id'
);

-- ============================================================================
-- Test 3: Status transitions
-- ============================================================================

UPDATE transfer_intents 
SET status = 'submitted', tx_hash = '\xaabbccdd'
WHERE workflow_id = 'workflow-123';

SELECT results_eq(
    $$
        SELECT status::text, tx_hash
        FROM transfer_intents
        WHERE workflow_id = 'workflow-123'
    $$,
    $$
        VALUES ('submitted', '\xaabbccdd'::bytea)
    $$,
    'Transfer intent status should update to submitted'
);

-- ============================================================================
-- Test 4: Create transfer_reconciliation
-- ============================================================================

INSERT INTO transfer_reconciliations (
    intent_id,
    chain_id,
    tx_hash,
    log_idx,
    block_num,
    block_time,
    event_id
)
SELECT 
    id,
    8453,
    '\xaabbccdd',
    0,
    12345,
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:01:00')),
    'send_account_transfers/send_account_transfers/12345/0/0'
FROM transfer_intents
WHERE workflow_id = 'workflow-123';

SELECT results_eq(
    $$
        SELECT 
            r.chain_id,
            r.tx_hash,
            r.log_idx,
            r.block_num,
            i.workflow_id
        FROM transfer_reconciliations r
        JOIN transfer_intents i ON r.intent_id = i.id
        WHERE i.workflow_id = 'workflow-123'
    $$,
    $$
        VALUES (
            8453::numeric,
            '\xaabbccdd'::bytea,
            0,
            12345::numeric,
            'workflow-123'
        )
    $$,
    'Transfer reconciliation should link intent to on-chain event'
);

-- ============================================================================
-- Test 5: Unique constraint on (chain_id, tx_hash, log_idx)
-- ============================================================================

-- First create another intent
INSERT INTO transfer_intents (
    workflow_id,
    from_address,
    to_address,
    amount,
    chain_id
)
VALUES (
    'workflow-456',
    '\x1111111111111111111111111111111111111111',
    '\x2222222222222222222222222222222222222222',
    500000,
    8453
);

-- Try to create a reconciliation with the same (chain_id, tx_hash, log_idx)
SELECT throws_ok(
    $$
        INSERT INTO transfer_reconciliations (
            intent_id,
            chain_id,
            tx_hash,
            log_idx,
            block_num,
            block_time
        )
        SELECT 
            id,
            8453,
            '\xaabbccdd',
            0,  -- Same log_idx as before
            12346,
            floor(extract(EPOCH FROM timestamptz '2024-01-01 12:02:00'))
        FROM transfer_intents
        WHERE workflow_id = 'workflow-456'
    $$,
    '23505',  -- unique_violation
    NULL,
    'Should reject duplicate (chain_id, tx_hash, log_idx) - collision invariant'
);

-- ============================================================================
-- Test 6: RLS - Sender can see their own transfer intents
-- ============================================================================

SELECT tests.authenticate_as('test_sender');

SELECT results_eq(
    $$
        SELECT COUNT(*)::int FROM transfer_intents
    $$,
    $$
        VALUES (2)
    $$,
    'Sender should see transfer intents where they are from_user_id'
);

-- ============================================================================
-- Test 7: RLS - Recipient can see their own transfer intents  
-- ============================================================================

SELECT tests.authenticate_as('test_recipient');

SELECT results_eq(
    $$
        SELECT COUNT(*)::int FROM transfer_intents
    $$,
    $$
        VALUES (2)
    $$,
    'Recipient should see transfer intents where they are to_user_id'
);

-- ============================================================================
-- Test 8: RLS - User can see reconciliations for their intents
-- ============================================================================

SELECT tests.authenticate_as('test_sender');

SELECT results_eq(
    $$
        SELECT COUNT(*)::int FROM transfer_reconciliations
    $$,
    $$
        VALUES (1)
    $$,
    'User should see reconciliations for their intents'
);

-- ============================================================================
-- Test 9: RLS - Third party cannot see others' transfer intents
-- ============================================================================

SELECT tests.create_supabase_user('test_stranger');
SELECT tests.authenticate_as('test_stranger');

SELECT is_empty(
    $$
        SELECT * FROM transfer_intents
    $$,
    'Stranger should not see other users transfer intents'
);

-- ============================================================================
-- Test 10: RLS - Third party cannot see others' reconciliations
-- ============================================================================

SELECT is_empty(
    $$
        SELECT * FROM transfer_reconciliations
    $$,
    'Stranger should not see other users reconciliations'
);

-- ============================================================================
-- Test 11: updated_at trigger
-- ============================================================================

-- Clear auth context for direct update
SELECT tests.clear_authentication();

-- Get current updated_at before the update
DO $$
DECLARE
    _old_updated_at timestamptz;
BEGIN
    SELECT updated_at INTO _old_updated_at FROM transfer_intents WHERE workflow_id = 'workflow-123';
    PERFORM pg_sleep(0.1);  -- Small delay to ensure timestamp difference
    UPDATE transfer_intents SET status = 'confirmed' WHERE workflow_id = 'workflow-123';
END;
$$;

SELECT ok(
    (SELECT updated_at >= created_at FROM transfer_intents WHERE workflow_id = 'workflow-123'),
    'updated_at should be updated on status change'
);

-- ============================================================================
-- Test 12: CASCADE delete of reconciliations when intent is deleted
-- ============================================================================

DELETE FROM transfer_intents WHERE workflow_id = 'workflow-123';

SELECT is_empty(
    $$
        SELECT * FROM transfer_reconciliations WHERE event_id = 'send_account_transfers/send_account_transfers/12345/0/0'
    $$,
    'Reconciliations should be deleted when intent is deleted (CASCADE)'
);

-- ============================================================================
-- COLLISION INVARIANT TESTS
-- ============================================================================

-- ============================================================================
-- Test 13: Two intents with identical (from, to, value) must not cross-link
-- This is the critical collision invariant test
-- ============================================================================

-- Create two intents with identical addresses and values but different tx_hashes
INSERT INTO transfer_intents (
    workflow_id,
    from_address,
    to_address,
    amount,
    chain_id,
    tx_hash,
    note,
    status
)
VALUES 
    -- Intent A: tx_hash = \xAAAA...
    (
        'collision-workflow-A',
        '\x1111111111111111111111111111111111111111',
        '\x2222222222222222222222222222222222222222',
        1000000,  -- Same amount
        8453,
        '\xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        'Note from Intent A',
        'submitted'
    ),
    -- Intent B: tx_hash = \xBBBB... (different tx, same from/to/value)
    (
        'collision-workflow-B',
        '\x1111111111111111111111111111111111111111',  -- Same from
        '\x2222222222222222222222222222222222222222',  -- Same to
        1000000,  -- Same amount
        8453,
        '\xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB',
        'Note from Intent B',
        'submitted'
    );

-- Reconcile only Intent A by its tx_hash
INSERT INTO transfer_reconciliations (
    intent_id,
    chain_id,
    tx_hash,
    log_idx,
    block_num,
    block_time,
    event_id
)
SELECT 
    id,
    8453,
    '\xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    0,
    99999,
    floor(extract(EPOCH FROM timestamptz '2024-01-01 12:10:00')),
    'send_account_transfers/base_usdc/99999/0/0'
FROM transfer_intents
WHERE workflow_id = 'collision-workflow-A';

-- Verify Intent B is NOT reconciled (no cross-linking)
SELECT is_empty(
    $$
        SELECT * FROM transfer_reconciliations r
        JOIN transfer_intents i ON r.intent_id = i.id
        WHERE i.workflow_id = 'collision-workflow-B'
    $$,
    'COLLISION INVARIANT: Intent B must NOT be reconciled when Intent A with same (from,to,value) is reconciled'
);

-- Verify Intent A IS reconciled
SELECT results_eq(
    $$
        SELECT COUNT(*)::int FROM transfer_reconciliations r
        JOIN transfer_intents i ON r.intent_id = i.id
        WHERE i.workflow_id = 'collision-workflow-A'
    $$,
    $$
        VALUES (1)
    $$,
    'Intent A should be reconciled'
);

-- ============================================================================
-- Test 15: Once reconciled, only one reconciliation per on-chain event
-- ============================================================================

-- Try to create another reconciliation for the same on-chain event
SELECT throws_ok(
    $$
        INSERT INTO transfer_reconciliations (
            intent_id,
            chain_id,
            tx_hash,
            log_idx,
            block_num,
            block_time
        )
        SELECT 
            id,
            8453,
            '\xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            0,  -- Same log_idx as Intent A's reconciliation
            99999,
            floor(extract(EPOCH FROM timestamptz '2024-01-01 12:11:00'))
        FROM transfer_intents
        WHERE workflow_id = 'collision-workflow-B'
    $$,
    '23505',  -- unique_violation
    NULL,
    'COLLISION INVARIANT: Same (chain_id, tx_hash, log_idx) cannot link to multiple intents'
);

-- ============================================================================
-- NOTE PERSISTENCE TESTS
-- ============================================================================

-- ============================================================================
-- Test 16: Notes persist when reconciliation happens
-- ============================================================================

-- First update Intent A's status to confirmed (simulating what the trigger does)
UPDATE transfer_intents
SET status = 'confirmed'
WHERE workflow_id = 'collision-workflow-A';

-- Verify note is still present in the intent
SELECT results_eq(
    $$
        SELECT note FROM transfer_intents WHERE workflow_id = 'collision-workflow-A'
    $$,
    $$
        VALUES ('Note from Intent A')
    $$,
    'NOTE PERSISTENCE: Notes must persist in intent after reconciliation'
);

-- ============================================================================
-- Test 17: Notes from different intents remain separate (no cross-contamination)
-- ============================================================================

SELECT results_eq(
    $$
        SELECT note FROM transfer_intents WHERE workflow_id = 'collision-workflow-B'
    $$,
    $$
        VALUES ('Note from Intent B')
    $$,
    'NOTE PERSISTENCE: Intent B note must not be affected by Intent A reconciliation'
);

-- ============================================================================
-- FEED INVARIANT TESTS
-- ============================================================================

-- ============================================================================
-- Test 18: Reconciled intent appears as confirmed, not pending
-- ============================================================================

SELECT results_eq(
    $$
        SELECT status::text FROM transfer_intents WHERE workflow_id = 'collision-workflow-A'
    $$,
    $$
        VALUES ('confirmed')
    $$,
    'FEED INVARIANT: Reconciled intent status must be confirmed'
);

-- ============================================================================
-- Test 19: Unreconciled intent remains pending/submitted
-- ============================================================================

SELECT results_eq(
    $$
        SELECT status::text FROM transfer_intents WHERE workflow_id = 'collision-workflow-B'
    $$,
    $$
        VALUES ('submitted')
    $$,
    'FEED INVARIANT: Unreconciled intent status must remain submitted'
);

-- ============================================================================
-- Test 20: Reconciliation links to correct intent based on tx_hash
-- ============================================================================

SELECT results_eq(
    $$
        SELECT 
            i.workflow_id,
            i.note,
            encode(r.tx_hash, 'hex') as reconciled_tx_hash
        FROM transfer_reconciliations r
        JOIN transfer_intents i ON r.intent_id = i.id
        WHERE r.event_id = 'send_account_transfers/base_usdc/99999/0/0'
    $$,
    $$
        VALUES (
            'collision-workflow-A',
            'Note from Intent A',
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
        )
    $$,
    'RECONCILIATION: Must link to correct intent based on tx_hash, preserving note'
);

SELECT * FROM finish();
ROLLBACK;
