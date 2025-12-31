# Temporal Transfer Race Condition Fixes

## Overview

This document describes the race condition fixes implemented in the transfer workflow system, specifically addressing issues between temporal workflows (`packages/workflows/src/transfer-workflow/workflow.ts`) and database triggers (`./supabase/schemas/`).

## Current Solution: Deterministic Reconciliation

The system uses a **deterministic reconciliation** approach that replaces all fuzzy matching with exact key-based linking:

1. **transfer_intents** table stores workflow intent state (note, status, addresses, amounts, tx_hash, user_op_hash)
2. **transfer_reconciliations** table links intents to on-chain events via exact keys: `(chain_id, tx_hash, log_idx)`
3. **reconcile_transfer_on_index()** trigger populates reconciliations when on-chain events are indexed
4. **activity_feed_merged** view provides a unified feed that shows exactly one entry per transfer

### Key Invariants

- **Collision Prevention**: Two intents with identical `(from, to, value)` will NEVER cross-link because matching uses `tx_hash` or `user_op_hash` only
- **Single Entry**: Once reconciled, the feed returns exactly one entry (the confirmed on-chain event)
- **Note Persistence**: Notes always survive regardless of temporal ordering (stored in intents, merged into activity)

## Race Conditions Fixed

### 1. Note Propagation Race Condition

**Problem:**
Notes attached to transfers were being deleted when the indexed activity (`send_account_transfer`) inserted faster than the temporal workflow completed. This resulted in users' transfer notes disappearing.

**Root Cause:**
The old indexer trigger used fuzzy matching (`addresses + value`) which could:
- Match the wrong temporal transfer when multiple had same (from, to, value)
- Delete notes before they could be propagated

**Solution:**
- Notes are stored in `transfer_intents.note` column (durable)
- `reconcile_transfer_on_index()` propagates notes to indexed activity on reconciliation
- No fuzzy matching - only exact `tx_hash` or `user_op_hash` matching

### 2. Duplicate Activities Race Condition

**Problem:**
Two activities for the same transfer could exist simultaneously:
- One with type `temporal_send_account_transfers` (from workflow)
- One with type `send_account_transfers` (from indexer)

**Root Cause:**
Fuzzy matching could miss the correct temporal transfer, leaving duplicates.

**Solution:**
- Deterministic reconciliation creates explicit link via `transfer_reconciliations`
- `activity_feed_merged` view filters out temporal activities once reconciled
- Each transfer appears exactly once in the feed

### 3. Cross-Linking Collision

**Problem:**
When multiple pending transfers had the same `(from, to, value)`, fuzzy matching could link an on-chain event to the wrong intent.

**Solution:**
- Matching uses ONLY `tx_hash` or `user_op_hash` (both globally unique)
- `UNIQUE(chain_id, tx_hash, log_idx)` constraint on `transfer_reconciliations` prevents duplicate links
- No fuzzy fallback that could cause cross-linking

## Database Schema

### Tables

```sql
-- Intent state (workflow-owned)
CREATE TABLE public.transfer_intents (
    id bigint PRIMARY KEY,
    workflow_id text UNIQUE NOT NULL,
    status transfer_intent_status NOT NULL,
    from_user_id uuid,
    to_user_id uuid,
    from_address bytea NOT NULL,
    to_address bytea NOT NULL,
    token_address bytea,
    amount numeric NOT NULL,
    chain_id numeric NOT NULL,
    note text,
    tx_hash bytea,
    user_op_hash bytea,
    activity_id bigint,
    created_at timestamptz,
    updated_at timestamptz
);

-- Deterministic link to on-chain events
CREATE TABLE public.transfer_reconciliations (
    id bigint PRIMARY KEY,
    intent_id bigint REFERENCES transfer_intents(id) ON DELETE CASCADE,
    chain_id numeric NOT NULL,
    tx_hash bytea NOT NULL,
    log_idx integer NOT NULL,
    block_num numeric NOT NULL,
    block_time numeric NOT NULL,
    event_id text,
    UNIQUE (chain_id, tx_hash, log_idx)  -- Collision invariant
);
```

### Key Trigger

```sql
-- Called when on-chain transfer is indexed
CREATE FUNCTION public.reconcile_transfer_on_index() RETURNS trigger AS $$
BEGIN
    -- Match by tx_hash or user_op_hash (exact, no fuzzy fallback)
    -- Create reconciliation record
    -- Update intent status to confirmed
    -- Propagate note to indexed activity
    -- Cleanup temporal activity
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Merged Activity Feed View

```sql
-- Unified feed: pending intents + confirmed transfers (no duplicates)
CREATE VIEW public.activity_feed_merged AS
-- Confirmed transfers (from indexed events, with notes from intents)
SELECT ... FROM activity a
LEFT JOIN transfer_reconciliations r ...
WHERE NOT reconciled_temporal_activity
UNION ALL
-- Pending intents (not yet on-chain)
SELECT ... FROM transfer_intents
WHERE status IN ('pending', 'submitted') AND NOT reconciled;
```

## Removed Components

The following fuzzy-matching components have been removed:

1. **`send_account_transfers_delete_temporal_activity()`** - Old fuzzy matching function
2. **`send_account_transfers_trigger_delete_temporal_activity`** - Old trigger using fuzzy matching
3. Fuzzy matching by `(from, to, value)` fallback strategy

## Test Coverage

See `supabase/tests/transfer_reconciliations_test.sql` for test cases:

### Collision Invariant Tests
1. ✓ Two intents with identical (from, to, value) must not cross-link
2. ✓ Same (chain_id, tx_hash, log_idx) cannot link to multiple intents
3. ✓ Reconciliation uses exact tx_hash/user_op_hash only

### Feed Invariant Tests
1. ✓ Once reconciled, feed returns exactly one entry
2. ✓ Pending intents appear in feed until reconciled
3. ✓ Reconciled intents disappear from pending, appear as confirmed

### Note Persistence Tests
1. ✓ Notes persist when indexer wins race
2. ✓ Notes persist when workflow wins race
3. ✓ Notes propagate from intent to indexed activity

## How It Works

### Normal Flow (Workflow Completes First)
1. Workflow creates `transfer_intent` with note, status='pending'
2. Workflow submits tx, updates status='submitted', sets tx_hash
3. Workflow waits for confirmation
4. Indexer processes on-chain event
5. `reconcile_transfer_on_index()` finds intent by tx_hash
6. Creates reconciliation, propagates note, confirms intent
7. Result: One confirmed activity in feed with note

### Race Condition Flow (Indexer Wins)
1. Workflow creates `transfer_intent` with note
2. Workflow submits tx, sets tx_hash
3. **Indexer processes event FAST** (before workflow updates status)
4. `reconcile_transfer_on_index()` finds intent by tx_hash
5. Creates reconciliation, propagates note, confirms intent
6. Workflow sees intent already confirmed
7. Result: One confirmed activity in feed with note (same outcome)

## Files Changed

- `supabase/schemas/transfer_intents.sql` - New intent and reconciliation tables
- `supabase/schemas/send_account_transfers.sql` - Deterministic reconciliation trigger
- `supabase/migrations/20251231200000_add_transfer_intents_reconciliations.sql` - Migration for new tables
- `supabase/migrations/20251231210000_deterministic_reconciliation.sql` - Migration for reconciliation logic
- `supabase/tests/transfer_reconciliations_test.sql` - Collision/race invariant tests

## Monitoring

To verify the system is working correctly:

```sql
-- Check for orphaned reconciliations (should be empty)
SELECT r.* 
FROM transfer_reconciliations r
LEFT JOIN transfer_intents i ON r.intent_id = i.id
WHERE i.id IS NULL;

-- Check for pending intents older than expected (should investigate)
SELECT * FROM transfer_intents
WHERE status IN ('pending', 'submitted')
  AND created_at < NOW() - INTERVAL '1 hour';

-- Check reconciliation rate
SELECT 
    COUNT(*) as total_intents,
    COUNT(r.id) as reconciled,
    COUNT(*) FILTER (WHERE i.status = 'confirmed') as confirmed
FROM transfer_intents i
LEFT JOIN transfer_reconciliations r ON r.intent_id = i.id;
```
