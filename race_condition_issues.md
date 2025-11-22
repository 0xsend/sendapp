# Race Condition Issues in Transfer Workflow and temporal_send_account_transfer Activities

## Bug 1: Notes Not Being Added to Activity Entry Due to Trigger Race Condition

### Summary
There is a race condition between multiple database triggers that prevents notes from being properly added to activity entries during transfer processing. The issue occurs when blockchain indexer creates `public.activity` records for `send_account_transfers`/`send_account_receives` events before the temporal workflow completes and sets the `send_account_transfers_activity_event_id` and `send_account_transfers_activity_event_name` fields in `temporal.send_account_transfers`.

### Root Cause Analysis
The race condition happens between two competing processes:

1. **Blockchain Indexer Process**: Creates `public.activity` records immediately when transfer events are detected on-chain
2. **Temporal Workflow Process**: Updates `temporal.send_account_transfers` with event references after transaction confirmation

### Current Flow (Problematic)
1. User initiates transfer via `packages/api/src/routers/temporal.ts`
2. Temporal workflow starts (`packages/workflows/src/transfer-workflow/workflow.ts`)
3. Transfer is submitted and confirmed on blockchain
4. **RACE CONDITION POINT**: Blockchain indexer may create `public.activity` record before temporal workflow updates `temporal.send_account_transfers`
5. Trigger `update_transfer_activity_before_insert()` runs but can't find matching temporal record with event IDs
6. Note is lost because the lookup in lines 336-341 fails

### Affected Files

#### Primary Files:
- `packages/workflows/src/transfer-workflow/workflow.ts` (lines 132-144)
- `supabase/schemas/activity.sql` (lines 321-356)
- `supabase/schemas/temporal.sql` (lines 246-346)
- `packages/api/src/routers/temporal.ts` (lines 20-127)

#### Supporting Files:
- `packages/workflows/src/transfer-workflow/activities.ts`
- `packages/workflows/src/transfer-workflow/supabase.ts`

### Code Analysis

#### In `packages/workflows/src/transfer-workflow/workflow.ts`:
```typescript
// Lines 132-144: Final update with event IDs happens AFTER blockchain confirmation
await updateTemporalSendAccountTransferActivity({
  workflow_id: workflowId,
  status: 'confirmed',
  send_account_transfers_activity_event_id: eventId,     // ← Set here
  send_account_transfers_activity_event_name: eventName, // ← Set here
  data: {
    ...(sentTransfer.data as Record<string, unknown>),
    tx_hash: hexToBytea(bundlerReceipt.receipt.transactionHash),
    block_num: bundlerReceipt.receipt.blockNumber.toString(),
    event_name: eventName,
    event_id: eventId,
  },
})
```

#### In `supabase/schemas/activity.sql`:
```sql
-- Lines 336-341: Trigger tries to find temporal record with event IDs
SELECT
    data->>'note',
    t_sat.workflow_id INTO note, temporal_event_id
FROM temporal.send_account_transfers t_sat
WHERE t_sat.send_account_transfers_activity_event_id = NEW.event_id  -- ← May be NULL
AND t_sat.send_account_transfers_activity_event_name = NEW.event_name; -- ← May be NULL
```

### Race Condition Timeline
```
Time 1: Temporal workflow starts
Time 2: Transaction submitted to blockchain  
Time 3: Transaction confirmed on blockchain
Time 4: Blockchain indexer detects event → Creates public.activity record
Time 5: update_transfer_activity_before_insert() trigger runs
        └── Looks up temporal record by event_id/event_name
        └── Fields are NULL because workflow hasn't updated them yet
        └── Note lookup fails
Time 6: Temporal workflow updates temporal.send_account_transfers with event IDs
        └── Too late - activity record already created without note
```

### Expected Behavior
Notes should be consistently added to activity entries for all transfers, regardless of timing between blockchain indexing and temporal workflow completion.

### Actual Behavior
Notes are intermittently missing from activity entries when blockchain indexer processes the transaction before the temporal workflow completes.

### Proposed Solutions

#### Option 1: Use workflow_id for note lookup (Recommended)
Modify the trigger to also look up notes by workflow_id as a fallback:

```sql
-- In supabase/schemas/activity.sql, modify update_transfer_activity_before_insert()
SELECT
    data->>'note',
    t_sat.workflow_id INTO note, temporal_event_id
FROM temporal.send_account_transfers t_sat
WHERE (
    -- Primary lookup by event IDs (when available)
    (t_sat.send_account_transfers_activity_event_id = NEW.event_id
     AND t_sat.send_account_transfers_activity_event_name = NEW.event_name)
    OR
    -- Fallback lookup by workflow_id pattern matching
    (NEW.event_id LIKE '%' || t_sat.workflow_id || '%' 
     AND t_sat.data->>'tx_hash' IS NOT NULL)
);
```

#### Option 2: Implement event-driven note updates
Create a separate trigger on `temporal.send_account_transfers` that updates existing activity records when event IDs are set.

#### Option 3: Defer activity creation
Modify blockchain indexer to check for pending temporal transfers before creating activity records.

### Steps to Reproduce
1. Submit a transfer with a note via the API
2. Monitor database during transaction processing
3. Observe that blockchain indexer may create activity record before temporal workflow sets event IDs
4. Note is missing from final activity record

### Testing Strategy
- Create integration test that simulates the race condition
- Add database trigger logging to track execution order
- Test with high transaction volume to increase race condition probability

---

## Bug 2: Duplicate Activity Entries Causing ActivityFeed Component to Show Repeats

### Summary
There is a race condition where both `temporal_send_account_transfers` and `send_account_transfers` activities exist simultaneously in the activity table, causing the ActivityFeed component to show duplicate entries for the same transfer. The current trigger-based cleanup system is unreliable and creates timing dependencies that don't always work.

### Root Cause Analysis
The system creates two activity records for each transfer:
1. **Temporal Activity**: Created by temporal workflow (`temporal_send_account_transfers`)
2. **Blockchain Activity**: Created by blockchain indexer (`send_account_transfers`)

The problem occurs when the cleanup triggers fail to execute in the correct order or timing, leaving both records in the database.

### Current Problematic Flow
```
1. User starts transfer via API (packages/api/src/routers/temporal.ts)
2. Temporal workflow creates temporal activity record
3. Transfer is submitted to blockchain
4. Blockchain indexer detects transaction → creates send_account_transfers activity
5. RACE CONDITION: Multiple triggers attempt cleanup but timing is unpredictable
   - update_transfer_activity_before_insert() may or may not delete temporal record
   - send_account_transfers_delete_temporal_activity() may miss records
6. Result: Both activity records remain, showing duplicates in UI
```

### Affected Files

#### Primary Files:
- `packages/app/features/home/TokenActivityFeed.tsx` (lines 61-79, 100-105)
- `packages/app/features/home/TokenActivityFeed.native.tsx` (lines 89-108)
- `supabase/schemas/activity.sql` (lines 89, 347-352)
- `supabase/schemas/send_account_transfers.sql` (lines 44-52)
- `supabase/migrations/20250328202922_fix_temporal_activity_handler_again.sql`

#### Supporting Files:
- `packages/app/features/home/TokenActivityRow.tsx`
- `packages/app/utils/activity.tsx`
- `supabase/schemas/temporal.sql`

### Evidence from Code

#### Frontend expects both event types (TokenActivityFeed.tsx):
```typescript
// Lines 61-79: Shows frontend specifically checks for both temporal and confirmed activities
const isCurrentlyPending = allActivities.some((activity) => {
  // Check for pending transfers
  if (
    activity.event_name === Events.TemporalSendAccountTransfers &&
    !['cancelled', 'failed', 'confirmed'].includes(activity.data?.status)
  ) {
    return true
  }
  return false
})
```

#### API queries include both event types:
```
# From playwright snapshots - actual API calls
/rest/v1/activity_feed?select=*&or=(event_name.eq.send_account_transfers,event_name.eq.temporal_send_account_transfers)
```

#### Multiple cleanup triggers create race conditions:

**Trigger 1 - In activity.sql:**
```sql
-- Lines 347-352: Tries to delete temporal activity when blockchain activity is inserted
IF temporal_event_id IS NOT NULL THEN
    DELETE FROM public.activity
    WHERE event_id = temporal_event_id
    AND event_name = 'temporal_send_account_transfers';
END IF;
```

**Trigger 2 - In send_account_transfers.sql:**
```sql
-- Lines 44-52: Another trigger tries to delete temporal activities
delete from public.activity a
where a.event_name = 'temporal_send_account_transfers'
  and a.event_id in (select t_sat.workflow_id
                     from temporal.send_account_transfers t_sat
                     where t_sat.created_at_block_num <= NEW.block_num
                       and t_sat.status != 'failed');
```

### Race Condition Timeline
```
Time 1: Temporal workflow creates temporal activity record
Time 2: User sees "pending" transfer in UI
Time 3: Transaction confirmed on blockchain
Time 4: Blockchain indexer creates send_account_transfers record
Time 5: RACE POINT - Multiple triggers fire simultaneously:
        ├── update_transfer_activity_before_insert() (before insert)
        └── send_account_transfers_delete_temporal_activity() (before insert)
Time 6: Timing-dependent result:
        ├── Success: One record remains (send_account_transfers)
        └── Failure: Both records remain → User sees duplicate
Time 7: ActivityFeed queries both event types → Shows duplicates
```

### Current Workarounds in Frontend

The frontend already has some logic to handle this:

```typescript
// In TokenActivityFeed.tsx - InvalidateQueries when pending becomes confirmed
if (wasPendingRef.current && !isCurrentlyPending) {
  queryClient.invalidateQueries({
    queryKey: ['token_activity_feed', { address: queryParams.token }],
    exact: false,
  })
}
```

However, this doesn't prevent the initial duplicate display.

### Expected Behavior
Users should see exactly one activity record per transfer, transitioning seamlessly from "pending" to "confirmed" state without duplicates.

### Actual Behavior
Users intermittently see duplicate entries for the same transfer - one temporal and one blockchain-indexed record.

### Proposed Solutions

#### Option 1: Move Cleanup Logic to Workflow (Recommended)
Instead of relying on database triggers, handle the cleanup sequentially in the temporal workflow:

```typescript
// In packages/workflows/src/transfer-workflow/workflow.ts
// After transaction is confirmed and event IDs are set:
await updateTemporalSendAccountTransferActivity({
  workflow_id: workflowId,
  status: 'confirmed',
  send_account_transfers_activity_event_id: eventId,
  send_account_transfers_activity_event_name: eventName,
  // ... other data
})

// NEW: Explicitly handle activity cleanup in sequence
await cleanupTemporalActivityAfterConfirmation({
  workflow_id: workflowId,
  final_event_id: eventId,
  final_event_name: eventName
})
```

#### Option 2: Improve Trigger Coordination
Consolidate all cleanup logic into a single, more robust trigger with proper locking.

#### Option 3: Frontend Deduplication
Implement client-side deduplication logic to filter out temporal activities when corresponding blockchain activities exist.

### Steps to Reproduce
1. Submit multiple transfers in quick succession
2. Monitor activity feed during and after transactions
3. Observe that some transfers appear twice in the feed
4. Check database to confirm both temporal and blockchain records exist

### Testing Strategy
- Create load test with multiple simultaneous transfers
- Add database logging to track trigger execution order
- Implement frontend tests that verify no duplicates appear
- Test with various network conditions and timing scenarios

---

## Bug 3: Redirect Race Condition - Transfer Activity Not Showing After Submit

### Summary
There is a race condition in the submit/redirect flow where the API waits for a transfer activity to exist before returning a successful response, but sometimes the temporal activity record is not created quickly enough, causing the transfer to appear as if it didn't work even though it was successfully submitted.

### Root Cause Analysis
The API endpoint includes a retry mechanism that waits for either:
1. An initialized temporal workflow activity record (`lookupInitializedWorkflow`)
2. A completed blockchain transfer receipt (`lookupTransferReceipt`)

However, there's a race condition where the temporal workflow hasn't yet created the activity record when the API check runs.

### Current Problematic Flow
```
1. User clicks SEND in confirm screen (packages/app/features/send/confirm/screen.tsx:192)
2. API call starts temporal workflow
3. API immediately starts waiting for activity to exist:
   - lookupInitializedWorkflow() checks for temporal activity
   - lookupTransferReceipt() checks for blockchain completion
4. RACE CONDITION: Neither check finds activity because:
   - Temporal workflow hasn't created activity record yet
   - Blockchain transaction not yet confirmed
5. API retries up to 20 times (86-123)
6. Sometimes succeeds, sometimes fails with "Transfer not yet submitted"
7. If fails: User sees no indication transfer worked
8. If succeeds: User gets redirected and sees activity
```

### Affected Files

#### Primary Files:
- `packages/api/src/routers/temporal.ts` (lines 86-164)
- `packages/app/features/send/confirm/screen.tsx` (lines 231-248)
- `packages/workflows/src/transfer-workflow/workflow.ts` (temporal activity creation)
- `supabase/schemas/temporal.sql` (temporal_transfer_after_upsert trigger)

### Code Analysis

#### In `packages/api/src/routers/temporal.ts`:
```typescript
// Lines 86-123: Retry mechanism waits for activity to exist
await withRetry(
  async () => {
    const initPromise = lookupInitializedWorkflow(workflowId, startTime).catch((e) => {
      log(e)
      return Promise.reject()
    })

    const receiptPromise = lookupTransferReceipt(userOpHash, startTime).catch((e) => {
      log(e)
      return Promise.reject()
    })

    try {
      return await Promise.any([initPromise, receiptPromise])  // ← Both may fail
    } catch (error) {
      throw new TRPCError({
        code: 'PRECONDITION_FAILED',
        message: 'Pending transfer not found: Please manually verify whether the send was completed.',
      })
    }
  },
  {
    retryCount: 20,  // ← Up to 20 retries
    delay: ({ count, error }) => {
      const backoff = 500 + Math.random() * 100
      return Math.min(backoff, 3000) // cap backoff at 3 seconds
    }
  }
)
```

#### In `lookupInitializedWorkflow`:
```typescript
// Lines 150-164: Looks for temporal activity record
const { data, error } = await supabaseAdmin
  .from('activity')
  .select('data->status')
  .eq('event_id', workflowId)
  .eq('event_name', 'temporal_send_account_transfers')  // ← May not exist yet
  .gte('created_at', startTime.toISOString())
  .single()

throwIf(error)
assert(!!data && data.status !== 'initialized', 'Transfer not yet submitted')  // ← Fails here
```

#### In `packages/app/features/send/confirm/screen.tsx`:
```typescript
// Lines 231-248: Frontend handles API response and redirects
const { workflowId } = await transfer({
  userOp: validatedUserOp,
  ...(note && { note: encodeURIComponent(note) }),
})

if (workflowId) {  // ← Only executes if API succeeds
  await queryClient.invalidateQueries({
    queryKey: ['token_activity_feed', { address: selectedCoin.token }],
    exact: false,
  })

  if (Platform.OS === 'web') {
    router.replace({ pathname: '/', query: { token: sendToken } })
    return
  }
  router.push('/(tabs)/')
  router.push({ pathname: '/token', query: { token: sendToken } })
}
```

### Race Condition Timeline
```
Time 1: User clicks SEND button
Time 2: API starts temporal workflow
Time 3: API begins waiting for activity (withRetry loop starts)
Time 4: lookupInitializedWorkflow() queries activity table
        └── No temporal activity record exists yet (workflow still starting)
Time 5: lookupTransferReceipt() checks blockchain
        └── Transaction not confirmed yet
Time 6: RACE CONDITION - Both lookups fail
Time 7: API retries (up to 20 times with 500-3000ms delays)
Time 8: Timeline diverges:
        ├── Success Path: Activity record appears → API returns → User redirected
        └── Failure Path: 20 retries exhausted → API throws error → User sees failure
Time 9: Meanwhile, temporal workflow continues and actually processes the transfer
```

### Timing Analysis
The race condition occurs because:
- **API retry timeout**: Max ~60 seconds (20 retries × 3 seconds max)
- **Temporal workflow startup**: Can take several seconds to create initial activity
- **Database trigger execution**: Additional latency for activity creation

### Expected Behavior
1. User clicks SEND
2. User sees loading state
3. Transfer is submitted successfully
4. User is redirected to activity feed
5. User sees pending transfer in the activity feed

### Actual Behavior (When Race Condition Occurs)
1. User clicks SEND
2. User sees loading state
3. Transfer is submitted successfully (but API doesn't know)
4. API times out waiting for activity record
5. User sees error message ("Transfer not yet submitted")
6. User confusion: Did the transfer work or not?
7. Later, user may see the transfer appeared in activity feed

### Evidence from Code

#### Frontend invalidates queries but only after API success:
```typescript
// Only runs if workflowId is returned (API succeeded)
if (workflowId) {
  await queryClient.invalidateQueries({ /* ... */ })
  router.replace({ pathname: '/', query: { token: sendToken } })
}
```

#### API error message reveals the race condition:
```typescript
message: 'Pending transfer not found: Please manually verify whether the send was completed.'
//        ↑ Indicates transfer may have actually worked
```

### Proposed Solutions

#### Option 1: Remove Activity Wait Requirement (Recommended)
Don't wait for activity to exist before returning success. The workflow ID itself indicates successful submission:

```typescript
// In packages/api/src/routers/temporal.ts
const { workflowId } = await startWorkflow({
  client,
  workflow: 'transfer',
  ids: [user.id, userOpHash],
  args: [userOp, note],
})

// REMOVE the withRetry block entirely
// Just return the workflowId immediately
return { workflowId }
```

#### Option 2: Make Activity Creation Synchronous in Workflow
Modify the temporal workflow to create the initial activity record synchronously before returning:

```typescript
// In packages/workflows/src/transfer-workflow/workflow.ts
// Create activity immediately, not in a trigger
await upsertTemporalSendAccountTransferActivity({
  workflow_id: workflowId,
  status: 'initialized',  // ← Ensure this creates activity record
  data: { sender: hexToBytea(userOp.sender) },
})
// Then continue with rest of workflow
```

#### Option 3: Frontend Optimistic Updates
Don't wait for API confirmation. Optimistically show the transfer and handle failures gracefully:

```typescript
// In confirm screen - show success immediately
const transfer = await transfer({ userOp: validatedUserOp, note })
// Always redirect, regardless of activity existence
router.replace({ pathname: '/', query: { token: sendToken } })
```

### Steps to Reproduce
1. Submit multiple transfers rapidly
2. Monitor network requests and database
3. Observe that some transfers fail with "Transfer not yet submitted"
4. Check activity table to confirm transfer actually exists
5. Verify user sees error but transfer completed successfully

### Testing Strategy
- Add artificial delays to temporal workflow startup
- Test with high concurrency to increase race condition probability
- Monitor success/failure rates of the API lookup functions
- Test user experience with various network conditions

---

## Summary: All Three Race Condition Bugs

These three bugs are interconnected and stem from the same fundamental issue: **temporal workflows and database triggers operating asynchronously with unpredictable timing**.

### Common Root Cause
All three bugs occur because the system tries to coordinate between:
1. **Temporal workflows** (asynchronous, unpredictable timing)
2. **Database triggers** (synchronous but timing-dependent)
3. **Blockchain indexer** (external system with variable latency)
4. **Frontend expectations** (assumes synchronous behavior)

### Recommended Overall Solution
Move away from trigger-based coordination to **sequential, workflow-managed coordination**:

1. **Workflow controls timing**: Let temporal workflows handle all database updates in sequence
2. **Eliminate trigger races**: Replace complex trigger interactions with simple workflow steps
3. **Frontend optimism**: Show success immediately, handle edge cases gracefully

### Bug Impact Summary

#### Bug 1 Impact
- **User-visible**: Transfer notes may not appear in activity feeds
- **Data integrity**: Inconsistent note storage across transfers
- **User experience**: Reduced trust in note functionality

#### Bug 2 Impact
- **User-visible**: Duplicate transfer entries in activity feeds
- **Data integrity**: Inconsistent activity record cleanup
- **User experience**: Confusion about transaction status and history
- **Performance**: Unnecessary duplicate data in queries

#### Bug 3 Impact
- **User-visible**: "Failed" transfers that actually succeeded
- **User experience**: Confusion about whether transfers worked
- **Trust**: Users may lose confidence in the system reliability
- **Support burden**: Increased support requests about "failed" transfers

### Priority
High - All three bugs affect core user functionality and data consistency. Bug 3 is particularly severe as it creates user confusion about whether their money transfers actually worked.

### Implementation Order
1. **Bug 3 first**: Most user-facing impact (failed UX for successful transfers)
2. **Bug 2 second**: Visible duplicates in activity feeds
3. **Bug 1 third**: Missing notes (less critical but important for UX)
