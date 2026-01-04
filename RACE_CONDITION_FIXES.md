# Temporal Transfer Race Condition Fixes

## Overview

This document describes the race condition fixes implemented in the transfer workflow system, specifically addressing issues between temporal workflows (`packages/workflows/src/transfer-workflow/workflow.ts`) and database triggers (`./supabase/schemas/`).

## Race Conditions Fixed

### 1. Note Propagation Race Condition

**Problem:**
Notes attached to transfers were being deleted when the indexed activity (`send_account_transfer`) inserted faster than the temporal workflow completed. This resulted in users' transfer notes disappearing.

**Root Cause:**
The indexer trigger used broad time-based matching (`created_at_block_num <= NEW.block_num`) to delete temporal activities, which could delete the temporal activity before the workflow had a chance to propagate the note to the indexed activity.

**Solution:**
1. **Added `activity_id` column** to `temporal.send_account_transfers` table with a foreign key constraint to `public.activity(id) ON DELETE CASCADE`
2. **New trigger `aaa_temporal_transfer_insert_pending_activity`** creates a pending activity when the temporal transfer status becomes 'sent', and stores the activity ID
3. **Updated `temporal_transfer_after_upsert` trigger** now:
   - Propagates notes from the temporal transfer to the indexed activity when status = 'confirmed'
   - Deletes the temporal activity by exact `activity_id` (not broad matching)

**Files Changed:**
- `supabase/schemas/temporal.sql` - Added activity_id column, FK constraint, and new trigger
- `supabase/schemas/send_account_transfers.sql` - Updated indexer trigger to use activity_id

### 2. Duplicate Activities Race Condition

**Problem:**
Two activities for the same transfer could exist simultaneously in the activity table:
- One with type `temporal_send_account_transfers` (from workflow)
- One with type `send_account_transfers` (from indexer)

**Root Cause:**
The indexer trigger used broad matching criteria that could:
- Miss the specific temporal transfer (wrong time window)
- Delete unrelated temporal transfers
- Leave duplicate activities when timing was wrong

**Solution:**
1. **Enhanced matching logic** in the indexer trigger with two strategies:
   - **Primary:** Match by `user_op_hash` (exact transaction match)
   - **Fallback:** Match by addresses (f/sender AND t/log_addr) + value (v/value)
2. **Direct deletion by `activity_id`** ensures only the specific temporal activity is removed
3. **Status filtering** only deletes activities with status IN ('initialized', 'submitted', 'sent')

**Files Changed:**
- `supabase/schemas/send_account_transfers.sql` - Enhanced matching logic and activity_id deletion

## Database Schema Changes

### New Column
```sql
ALTER TABLE temporal.send_account_transfers
ADD COLUMN activity_id bigint;
```

### New Index
```sql
CREATE INDEX idx_temporal_send_account_transfers_activity_id 
ON temporal.send_account_transfers USING btree (activity_id);
```

### New Foreign Key
```sql
ALTER TABLE temporal.send_account_transfers
ADD CONSTRAINT fk_transfer_activity
FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON DELETE CASCADE;
```

### New Trigger
```sql
CREATE TRIGGER aaa_temporal_transfer_insert_pending_activity
AFTER INSERT OR UPDATE ON temporal.send_account_transfers
FOR EACH ROW EXECUTE FUNCTION temporal.temporal_transfer_insert_pending_activity();
```

## Test Coverage

Comprehensive test suite added in `packages/workflows/src/transfer-workflow/race-conditions.test.ts` with 10 test cases:

### Note Propagation Tests (3 tests)
1. ✓ Creates temporal activity with note when status becomes 'sent'
2. ✓ Propagates note from temporal to indexed activity when confirmed
3. ✓ Deletes temporal activity by activity_id after note propagation

### Duplicate Prevention Tests (5 tests)
1. ✓ Deletes temporal activity by exact activity_id when indexer runs
2. ✓ Matches temporal transfer by user_op_hash (primary strategy)
3. ✓ Matches temporal transfer by addresses+value (fallback strategy)
4. ✓ Only deletes temporal activities in pending states
5. ✓ Handles ETH transfer matching (sender/log_addr instead of f/t)

### Integration Tests (2 tests)
1. ✓ Fast indexer scenario: indexer runs before workflow completes
2. ✓ Normal scenario: workflow completes before indexer

All tests pass ✓

## Verification

To verify the fixes are working correctly:

```bash
# Run the test suite
cd packages/workflows
yarn test race-conditions.test.ts

# Expected output: All 10 tests pass
```

## How It Works

### Normal Flow (Workflow Completes First)
1. Temporal workflow creates transfer with status='sent'
2. Trigger `aaa_temporal_transfer_insert_pending_activity` creates activity with note, stores activity_id
3. Workflow updates to status='confirmed' with indexed event info
4. Trigger `temporal_transfer_after_upsert` propagates note to indexed activity
5. Trigger deletes temporal activity by exact activity_id
6. Result: One activity remains with note intact

### Race Condition Flow (Indexer Wins)
1. Temporal workflow creates transfer with status='sent'
2. Trigger creates activity with note, stores activity_id
3. **Indexer runs FAST** and indexes the transfer
4. Indexer trigger finds temporal transfer by user_op_hash or addresses+value
5. Indexer trigger deletes temporal activity by exact activity_id
6. Workflow tries to update to status='confirmed'
7. Trigger checks if indexed activity exists, propagates note if present
8. Result: One activity remains, note preserved

## Key Improvements

1. **Exact Deletion** - Using activity_id FK ensures we delete the correct temporal activity
2. **Note Preservation** - Notes are captured in the temporal activity before any deletion
3. **Enhanced Matching** - Two-strategy matching (user_op_hash primary, addresses+value fallback) ensures correct transfer identification
4. **Status Filtering** - Only pending activities are targeted, avoiding interference with confirmed transfers
5. **ETH Support** - Handles both token transfers (f/t/v) and ETH transfers (sender/log_addr/value)

## Related Files

- `packages/workflows/src/transfer-workflow/workflow.ts` - Temporal workflow
- `packages/workflows/src/transfer-workflow/race-conditions.test.ts` - Test suite
- `supabase/schemas/temporal.sql` - Temporal schema and triggers
- `supabase/schemas/send_account_transfers.sql` - Indexer trigger

## Migration Path

These changes require a database migration to add the `activity_id` column and associated constraints. The migration should:

1. Add the activity_id column (nullable initially)
2. Create the index
3. Add the foreign key constraint
4. Deploy the new triggers
5. Backfill activity_id for existing records if needed

## Monitoring

To monitor for any remaining race conditions:

```sql
-- Check for duplicate activities for the same transfer
SELECT 
  workflow_id,
  COUNT(*) as activity_count
FROM (
  SELECT workflow_id FROM temporal.send_account_transfers WHERE activity_id IS NOT NULL
  UNION ALL
  SELECT event_id as workflow_id FROM public.activity 
  WHERE event_name IN ('temporal_send_account_transfers', 'send_account_transfers')
) activities
GROUP BY workflow_id
HAVING COUNT(*) > 1;

-- Check for transfers with missing notes
SELECT 
  t.workflow_id,
  t.data->>'note' as temporal_note,
  a.data->>'note' as activity_note
FROM temporal.send_account_transfers t
LEFT JOIN public.activity a ON a.id = t.activity_id
WHERE t.data ? 'note' 
  AND t.data->>'note' IS NOT NULL
  AND t.status = 'confirmed'
  AND (a.data->>'note' IS NULL OR a.data->>'note' = '');
```
