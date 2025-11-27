# Activity Table - Account Deletion Complete Analysis

## Table of Contents
1. [Overview](#overview)
2. [Current Database Schema](#current-database-schema)
3. [Activity Types & Impact Analysis](#activity-types--impact-analysis)
4. [The Indexer Question](#the-indexer-question)
5. [Recommended Solution](#recommended-solution)
6. [Implementation Guide](#implementation-guide)

---

## Overview

This document provides a complete analysis of how the `activity` table behaves when users delete their accounts, examining:
- Database schema and foreign key constraints
- All 11 activity types and their deletion impact
- Blockchain indexer (Shovel) behavior and re-creation scenarios
- User experience implications
- Recommended solution with implementation details

### Key Question
**When a user deletes their account, what happens to activity records involving that user, and how does it affect other users?**

---

## Current Database Schema

### Table Structure

```sql
CREATE TABLE IF NOT EXISTS "public"."activity" (
    "id" integer NOT NULL,
    "event_name" "text" NOT NULL,
    "event_id" character varying(255) NOT NULL,
    "from_user_id" "uuid",
    "to_user_id" "uuid",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

### Foreign Key Constraints (Current)

```sql
ALTER TABLE ONLY "public"."activity"
    ADD CONSTRAINT "activity_from_user_id_fkey"
    FOREIGN KEY ("from_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."activity"
    ADD CONSTRAINT "activity_to_user_id_fkey"
    FOREIGN KEY ("to_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
```

### Unique Index

```sql
CREATE UNIQUE INDEX "activity_event_name_event_id_idx"
    ON "public"."activity"
    USING "btree" ("event_name", "event_id");
```

### Current Behavior

**ON DELETE CASCADE means:**
- When a user is deleted → **ALL activity rows** where they appear as `from_user_id` or `to_user_id` are **completely deleted**
- This affects OTHER users' activity feeds
- Activity disappears from the database entirely

---

## Activity Types & Impact Analysis

### Summary Table

| Event Name | from_user_id | to_user_id | Other Users Affected? | Severity | Needs Preservation? |
|------------|--------------|------------|-----------------------|----------|---------------------|
| `send_account_transfers` | Sender | Recipient | ✅ YES - Both see it | 🔴 HIGH | ✅ Yes - Preserve |
| `send_account_receives` | Sender | Recipient | ✅ YES - Both see it | 🔴 HIGH | ✅ Yes - Preserve |
| `referrals` | Referrer | Referred | ✅ YES - Referrer sees it | 🟡 MEDIUM | ❌ Auto-handled by CASCADE |
| `temporal_send_account_transfers` | Sender | Recipient | ✅ YES - Both see it | 🟡 MEDIUM | ✅ Yes - Preserve |
| `tag_receipt_usdc` | Buyer | NULL | ❌ No | 🟢 LOW | ❌ Let CASCADE delete |
| `send_earn_deposit` | Depositor | NULL | ❌ No | 🟢 LOW | ❌ Let CASCADE delete |
| `send_earn_withdraw` | Withdrawer | NULL | ❌ No | 🟢 LOW | ❌ Let CASCADE delete |
| `temporal_send_earn_deposit` | Depositor | NULL | ❌ No | 🟢 LOW | ❌ Let CASCADE delete |
| `send_account_signing_key_added` | Owner | NULL | ❌ No | 🟢 LOW | ❌ Let CASCADE delete |
| `send_account_signing_key_removed` | Owner | NULL | ❌ No | 🟢 LOW | ❌ Let CASCADE delete |
| `tag_receipts` (deprecated) | Buyer | NULL | ❌ No | 🟢 LOW | ❌ Let CASCADE delete |

### Impact Categories

#### 🔴 HIGH IMPACT - Breaks Other Users' Experience

**1. `send_account_transfers` (Token Transfers)**
```typescript
event_name: 'send_account_transfers'
from_user: UserSchema  // Sender
to_user: UserSchema    // Recipient
data: { f: Address, t: Address, v: BigInt, note?: string, coin: Coin }
```

**Problem Scenario:**
```
Alice sends $100 USDC to Bob
→ Bob sees: "Received $100 from Alice"
→ Alice deletes account
→ CASCADE deletes activity row
→ Bob's activity: Transaction disappears entirely ❌
```

**2. `send_account_receives` (ETH Receives)**
- Similar to transfers
- External sender → Send user
- Recipient loses record of ETH received

#### 🟡 MEDIUM IMPACT - Requires Special Handling

**3. `referrals`** - Auto-handled by CASCADE
```typescript
event_name: 'referrals'
from_user: UserSchema  // Referrer
to_user: UserSchema    // Referred user
data: { tags: string[] | null }
```

**Scenario:**
```
Charlie refers Dave
→ Charlie sees: "Dave joined via your referral"
→ Dave deletes account
→ Charlie's activity: Referral record disappears ✅ (Intentional behavior)
```

**Why this is OK:**
- `referrals` table has FK to `profiles` with `ON DELETE CASCADE`
- When user deletes → `profiles` CASCADE deletes → `referrals` CASCADE deletes
- `referrals_delete_activity_trigger` fires and cleans up activity row
- **No preservation needed** - referrals should disappear when either party leaves
- **No special handling required** - existing CASCADE + trigger handles it automatically

**4. `temporal_send_account_transfers` (Pending Transfers)**
- Less critical since temporary (usually replaced when confirmed)
- But still affects both sender and recipient

#### 🟢 LOW IMPACT - Only Affects Deleting User

**5-11. Self-contained activities:**
- Tag purchases (`tag_receipt_usdc`)
- Send Earn deposits/withdrawals
- Key management events
- Only visible to the user performing the action
- `to_user_id` is always NULL
- Acceptable to CASCADE delete

---

## The Indexer Question

### How Shovel (Blockchain Indexer) Works

Send uses [Shovel](https://indexsupply.com/shovel/) for blockchain indexing:

1. **Continuous polling**: Monitors blockchain for new blocks (seconds to minutes)
2. **Trigger-based**: INSERT triggers fire when new blockchain data arrives
3. **UPSERT pattern**: All indexer triggers use `ON CONFLICT ... DO UPDATE`

```sql
-- Example: send_account_transfers trigger
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
VALUES ('send_account_transfers', NEW.event_id, _f_user_id, _t_user_id, _data, ...)
ON CONFLICT (event_name, event_id) DO UPDATE SET
    from_user_id = _f_user_id,
    to_user_id = _t_user_id,
    data = _data,
    created_at = to_timestamp(NEW.block_time) at time zone 'UTC';
```

### Will Deleted Activity Rows Be Re-created?

**Answer: Only during backfill operations (rare)**

#### Normal Operation (Daily Use)
- Shovel tracks latest processed block
- Only processes **new blocks forward**
- **Does NOT re-scan old blocks**
- **Deleted activities stay deleted**

#### Special Operations (Rare)
Re-creation happens during:
1. **Manual backfills** - Intentional re-scan of old blocks
2. **Database restores** - After disaster recovery
3. **Indexer restarts with backfill flag** - During development/maintenance

**Frequency**: 1-2 times per year (scheduled maintenance)

### What Happens During Backfill?

```sql
-- Backfill re-processes old blocks
-- Looks up user_id for deleted user's address
SELECT user_id FROM send_accounts WHERE address_bytes = 0xALICE
→ Returns NULL (user deleted, send_accounts CASCADE deleted too)

-- Inserts activity with NULL user_id
INSERT INTO activity (..., from_user_id=NULL, to_user_id='bob-uuid', ...)
→ Activity row re-created with NULL from_user_id
```

**Result after backfill with CASCADE:**
- Mix of deleted activities (normal operation)
- Re-created activities with NULL user_ids (after backfill)
- Inconsistent database state

### Blockchain-Indexed vs Non-Indexed Activities

**✅ Will re-create during backfills (blockchain-indexed):**
- `send_account_transfers`
- `send_account_receives`
- `tag_receipt_usdc`
- `send_earn_deposit`
- `send_earn_withdraw`
- `send_account_signing_key_added`
- `send_account_signing_key_removed`

**❌ Will NOT re-create (not blockchain-indexed):**
- `referrals` - Triggered from `referrals` table inserts
- `temporal_send_account_transfers` - Application workflows
- `temporal_send_earn_deposit` - Application workflows

---

## Recommended Solution

### Hybrid Approach: Trigger + CASCADE

The best solution combines a database trigger with CASCADE delete to achieve:
- ✅ Preserve activity for other users (set to NULL)
- ✅ Clean up solo activities (CASCADE deletes them)
- ✅ No orphaned data in the database
- ✅ Simple implementation leveraging existing CASCADE behavior

### How It Works

**Strategy:**
1. Keep `ON DELETE CASCADE` on foreign keys (current setup)
2. Add a BEFORE DELETE trigger on `auth.users`
3. Trigger sets user_id to NULL **only** where another user exists
4. CASCADE naturally deletes everything else

**Example Flow:**

```sql
-- Before Alice deletes her account:
Row 1: from_user=Alice, to_user=Bob     -- Transfer (2 users)
Row 2: from_user=Alice, to_user=NULL    -- Tag purchase (1 user)
Row 3: from_user=Charlie, to_user=Alice -- Referral (2 users)

-- Step 1: Trigger fires BEFORE deletion
-- Sets NULL only where the OTHER user exists:
Row 1: from_user=NULL, to_user=Bob      -- Protected from cascade (Bob still referenced)
Row 3: from_user=Charlie, to_user=NULL  -- Protected from cascade (Charlie still referenced)

-- Step 2: CASCADE fires after trigger completes
Row 2: DELETED (only Alice was referenced, now cascade can delete it)
```

### Deletion Logic

**Keep the row (set deleted user_id to NULL) if:**
- The activity has BOTH user_ids defined and one is still active
- Example: Alice → Bob transfer, Alice deletes → `from_user_id=NULL, to_user_id=Bob`

**Delete the row (let CASCADE handle it) if:**
- Only the deleted user is referenced (`to_user_id` is already NULL)
- Example: Alice's tag purchase → CASCADE deletes it completely

### Why This Hybrid Approach is Better

#### ✅ Preserves Other Users' Transaction History
```
Bob's activity feed:
- Before: "Received $100 from Alice"
- After Alice deletes: "Received $100 from [Deleted User]" ✅
```

#### ✅ Cleans Up Solo Activities
```
Alice's solo activities:
- Tag purchases (from_user=Alice, to_user=NULL) → DELETED ✅
- Earn deposits (from_user=Alice, to_user=NULL) → DELETED ✅
- Key management (from_user=Alice, to_user=NULL) → DELETED ✅

No orphaned data!
```

#### ✅ Referrals Auto-Handled
```
Charlie's referral of Dave:
- Dave deletes account
→ profiles CASCADE deletes
→ referrals CASCADE deletes
→ referrals_delete_activity_trigger cleans up activity
→ Referral disappears from Charlie's feed ✅ (Intentional)

No special preservation needed!
```

#### ✅ Blockchain Alignment
- Transactions involving other users are permanent on-chain
- Database preserves these with NULL for deleted user
- Solo activities can be safely removed (only affected the deleted user)

#### ✅ Backfill Resilience
```
With Hybrid Approach:
1. User deletes → trigger protects multi-user rows, cascade deletes solo rows
2. Backfill runs → UPSERT finds existing multi-user rows (no change)
3. Solo activities won't be re-created (no user_id to look up)
4. Result: Consistent state
```

#### ✅ Frontend Already Supports It
```typescript
// packages/app/utils/zod/activity/BaseEventSchema.ts
from_user: UserSchema.nullable()  // Already nullable!
to_user: UserSchema.nullable()    // Already nullable!
```

### Why Blanket SET NULL Would Be Problematic

#### ❌ Creates Orphaned Data
- Solo activities (tag purchases, earn deposits) remain forever with NULL user_ids
- No one can see them, but they clutter the database
- Example: Alice's tag purchase → `from_user=NULL, to_user=NULL` (useless row)

#### ❌ Database Bloat
- Accumulates meaningless rows over time
- Every deleted user leaves behind their solo activity history
- No value to anyone, just wasted storage

### Why Pure CASCADE Would Be Problematic

#### ❌ Breaks Other Users' Experience
- Bob loses transaction history when Alice deletes
- Charlie loses referral records when Dave deletes

#### ❌ Inconsistent After Backfills
- Normal operation: rows deleted
- After backfill: rows re-created with NULL user_ids
- Unpredictable database state

#### ❌ Conflicts with Blockchain Immutability
- On-chain transactions are permanent
- Why delete them from our database?

---

## Implementation Guide

### Phase 1: Database Trigger

**File**: `supabase/schemas/activity.sql`

Add trigger function and trigger:

```sql
-- Function to preserve multi-user activities before user deletion
-- Only preserves transaction-related activities (transfers and receives)
-- Referrals are auto-handled by CASCADE + existing delete trigger
CREATE OR REPLACE FUNCTION preserve_activity_before_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Set from_user_id to NULL only where to_user_id exists and is different
    -- Only for transaction activities (not referrals - they're auto-deleted)
    UPDATE activity
    SET from_user_id = NULL
    WHERE from_user_id = OLD.id
      AND to_user_id IS NOT NULL
      AND to_user_id != OLD.id
      AND event_name IN ('send_account_transfers', 'send_account_receives', 'temporal_send_account_transfers');

    -- Set to_user_id to NULL only where from_user_id exists and is different
    -- Only for transaction activities (not referrals - they're auto-deleted)
    UPDATE activity
    SET to_user_id = NULL
    WHERE to_user_id = OLD.id
      AND from_user_id IS NOT NULL
      AND from_user_id != OLD.id
      AND event_name IN ('send_account_transfers', 'send_account_receives', 'temporal_send_account_transfers');

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger that fires BEFORE user deletion
CREATE TRIGGER preserve_activity_on_user_deletion
    BEFORE DELETE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION preserve_activity_before_user_deletion();
```

**How it works:**
1. Trigger fires **BEFORE** the user is deleted
2. Updates activity rows to set user_ids to NULL **only** where:
   - The other user exists (multi-user activity)
   - Event is a transaction type (transfers/receives)
3. **Referrals are excluded** - they're handled by existing CASCADE chain:
   - `auth.users` → `profiles` → `referrals` → `referrals_delete_activity_trigger` → `activity`
4. Leaves solo activities untouched (they will be CASCADE deleted)
5. After trigger completes, CASCADE deletes any remaining rows that only reference the deleted user

**Generate migration:**
```bash
cd supabase
yarn supabase stop
# Edit schemas/activity.sql with trigger code above
yarn migration:diff add_activity_preservation_trigger
yarn supabase start
```

### Phase 2: Testing

#### Database Tests (`supabase/tests/activity_deletion_test.sql`)

```sql
BEGIN;

SELECT plan(6);

-- Setup: Create two users
INSERT INTO auth.users (id) VALUES ('test-user-alice');
INSERT INTO profiles (id, name) VALUES ('test-user-alice', 'Alice');

INSERT INTO auth.users (id) VALUES ('test-user-bob');
INSERT INTO profiles (id, name) VALUES ('test-user-bob', 'Bob');

-- Test Case 1: Multi-user activity (transfer) - should preserve with NULL
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES ('send_account_transfers', 'test-transfer-1', 'test-user-alice', 'test-user-bob', '{}'::jsonb);

-- Test Case 2: Solo activity (tag purchase) - should be deleted
INSERT INTO activity (event_name, event_id, from_user_id, to_user_id, data)
VALUES ('tag_receipt_usdc', 'test-tag-1', 'test-user-alice', NULL, '{}'::jsonb);

-- Test Case 3: Referral - CASCADE should delete it
INSERT INTO referrals (id, referrer_id, referred_id)
VALUES (1, 'test-user-bob', 'test-user-alice');

-- Referral trigger creates activity automatically
-- Wait for trigger to complete

-- Verify all activities exist before deletion
SELECT ok(
    (SELECT COUNT(*) FROM activity WHERE event_id IN ('test-transfer-1', 'test-tag-1')) >= 2,
    'At least 2 activity rows exist before deletion'
);

-- Delete Alice
DELETE FROM auth.users WHERE id = 'test-user-alice';

-- Test 1: Transfer preserved with NULL from_user_id
SELECT ok(EXISTS(
    SELECT 1 FROM activity
    WHERE event_id = 'test-transfer-1'
      AND from_user_id IS NULL
      AND to_user_id = 'test-user-bob'
), 'Transfer activity preserved with NULL from_user_id');

-- Test 2: Tag purchase deleted (solo activity)
SELECT ok(NOT EXISTS(
    SELECT 1 FROM activity WHERE event_id = 'test-tag-1'
), 'Tag purchase deleted (was solo activity)');

-- Test 3: Referral deleted by CASCADE chain
SELECT ok(NOT EXISTS(
    SELECT 1 FROM activity WHERE event_name = 'referrals' AND (from_user_id = 'test-user-bob' OR to_user_id = 'test-user-alice')
), 'Referral activity deleted by CASCADE');

-- Test 4: Bob still exists and has transfer activity
SELECT ok(
    (SELECT COUNT(*) FROM activity WHERE to_user_id = 'test-user-bob') = 1,
    'Bob still has his transfer activity'
);

SELECT * FROM finish();
ROLLBACK;
```

---

## Summary

### Current State (CASCADE Only)
- ❌ Deletes ALL activity rows when user deletes account
- ❌ Other users lose transaction/referral history
- ❌ Inconsistent after backfills (some deleted, some NULL)
- ❌ Conflicts with blockchain immutability

### Alternative: Blanket SET NULL
- ✅ Preserves other users' history
- ❌ Creates orphaned solo activities (tag purchases, earn deposits with NULL user_ids)
- ❌ Database bloat with meaningless rows
- ❌ No one can see solo activities, but they remain forever

### Recommended State (Hybrid: Trigger + CASCADE)
- ✅ Preserves transaction activity with NULL for deleted user (transfers/receives)
- ✅ Referrals auto-deleted by existing CASCADE chain (intentional behavior)
- ✅ Cleans up solo activities (CASCADE deletes them)
- ✅ No orphaned data
- ✅ Other users maintain their transaction history
- ✅ Consistent after backfills
- ✅ Aligns with blockchain immutability
- ✅ Frontend already supports nullable users
- ✅ Leverages existing CASCADE behavior

### How Hybrid Works

**Transaction activities (preserved):**
```
Before: from_user=Alice, to_user=Bob (transfer)
After:  from_user=NULL, to_user=Bob (Bob still sees it)
```

**Referral activities (auto-deleted by CASCADE):**
```
Before: from_user=Charlie, to_user=Dave (referral)
After:  DELETED (via profiles → referrals → activity CASCADE chain)
```

**Solo activities (deleted):**
```
Before: from_user=Alice, to_user=NULL (tag purchase)
After:  DELETED (no one else needs it)
```

### Decision Summary

**Recommendation: Hybrid (Trigger + CASCADE)**
- Best of both worlds: preserves important data, cleans up unnecessary data
- Simple implementation: trigger protects multi-user rows, CASCADE handles the rest
- No trade-offs: gets all the benefits without the drawbacks

---

**Document created**: 2025-11-27
**Status**: Complete Consolidated Analysis
