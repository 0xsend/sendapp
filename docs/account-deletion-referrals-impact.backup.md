# Account Deletion: Referrals & Leaderboard Impact

## Overview

This document provides a detailed analysis of how account deletion affects the referrals system and leaderboard. When a referred user deletes their account, this has cascading effects on the referrer's leaderboard data.

## Implementation Status

✅ **IMPLEMENTED** - Leaderboard cleanup has been implemented and tested.

- **Migration**: `20251127111203_referrals_triggers_on_account_delete.sql`
- **Tests**: `supabase/tests/account_deletion_referrals_test.sql` (8 test cases - all passing)
- **Date Completed**: 2025-11-27
- **Date Updated**: 2025-11-27 - Simplified to only handle leaderboard (distributor handles verifications)

## Executive Summary

**Status**: ✅ Leaderboard issue resolved. Distribution verifications handled by distributor.

| Issue | Component | Severity | Status |
|-------|-----------|----------|--------|
| 1 | Leaderboard referral counts | 🔴 CRITICAL | ✅ Fixed - DELETE trigger added |
| 2 | Tag registration verifications | ✅ None | ✅ Already handles correctly |
| 3 | Tag referral verifications | ✅ None | ✅ Handled by distributor (runs hourly) |
| 4 | Total referrals verifications | ✅ None | ✅ Handled by distributor (runs hourly) |

## Implementation Summary

### Changes Implemented

**Schema Files Modified**:
- `supabase/schemas/referrals.sql` - Added `decrement_leaderboard_referrals_on_delete()` function and trigger

**Migration Created**:
- `supabase/migrations/20251127111203_referrals_triggers_on_account_delete.sql`
  - Creates leaderboard decrement trigger function
  - Sets proper ownership and security grants
  - Creates trigger on `referrals` table

**Test Coverage**:
- `supabase/tests/account_deletion_referrals_test.sql` (8 test cases)
  - Leaderboard decrement scenarios
  - Edge cases and error handling
  - **Result**: All tests passing ✅

### Key Principles

1. **Leaderboard reflects current state**: Shows only current referrals, not deleted users
2. **Distribution verifications handled by distributor**: The distributor service runs hourly and recalculates all verification weights based on current referrals and shares
3. **Historical data preserved**: Closed distributions remain unchanged
4. **Future distributions protected**: New distributions won't have referral records for deleted users

---

## Issue 1: Leaderboard Referrals All Time

### Location
- **Table**: `private.leaderboard_referrals_all_time`
- **Schema File**: `supabase/schemas/referrals.sql`

### Current Behavior

**On Referral Creation**:
```sql
-- Trigger: update_leaderboard_referrals_all_time_referrals
-- Fires: AFTER INSERT ON public.referrals
-- Action: Increments referral count
INSERT INTO private.leaderboard_referrals_all_time (user_id, referrals, updated_at)
VALUES (NEW.referrer_id, 1, now())
ON CONFLICT (user_id) DO UPDATE
SET referrals = private.leaderboard_referrals_all_time.referrals + 1
```

**On User Deletion**:
- ❌ NO DELETE trigger exists
- Referral record CASCADE deleted (via `referrals.referred_id → profiles.id ON DELETE CASCADE`)
- Leaderboard entry remains unchanged
- Count becomes permanently inflated

**On Referrer Deletion**:
- ✅ Leaderboard entry CASCADE deleted (via `leaderboard_referrals_all_time.user_id → auth.users(id) ON DELETE CASCADE`)

### Problem Scenario

```
Step 1: User A refers User B
  → referrals table: (referrer_id: A, referred_id: B)
  → leaderboard: (user_id: A, referrals: 1)

Step 2: User B deletes their account
  → profiles.id = B is CASCADE deleted
  → referrals record CASCADE deleted
  → leaderboard: (user_id: A, referrals: 1) ← WRONG! Should be 0

Result: User A's leaderboard count is permanently inflated
```

### Impact Analysis

**Severity**: 🔴 **CRITICAL** - Data integrity issue

**Why Critical**:
- Affects core leaderboard functionality
- Compounds over time as more users delete accounts
- No automatic correction mechanism
- Undermines trust in referral statistics

**Scope**:
- All referrers whose referred users delete accounts
- Leaderboard becomes increasingly inaccurate

### Required Solution

Add DELETE trigger to decrement referral count when a referral is deleted.

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION private.decrement_leaderboard_referrals_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE private.leaderboard_referrals_all_time
    SET referrals = GREATEST(0, referrals - 1),  -- Never go below 0
        updated_at = now()
    WHERE user_id = OLD.referrer_id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER decrement_leaderboard_referrals
AFTER DELETE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION private.decrement_leaderboard_referrals_on_delete();
```

### Testing Requirements

1. **Basic increment/decrement**
   - Create referral → verify count = 1
   - Delete referred user → verify count = 0

2. **Multiple referrals**
   - User A refers User B, C, D → count = 3
   - User B deletes account → count = 2
   - User C deletes account → count = 1
   - User D deletes account → count = 0

3. **Edge case: Referrer doesn't exist**
   - Delete referral when referrer already deleted
   - Should not error (no matching user_id to update)

4. **Edge case: Count already at 0**
   - Manually set count to 0
   - Delete referral
   - Verify GREATEST(0, -1) = 0 (doesn't go negative)

5. **Concurrent deletions**
   - Multiple referrals deleted simultaneously
   - All counts should update correctly

### Data Validation Query

After deployment, use this query to verify leaderboard accuracy:

```sql
-- Check for mismatches between leaderboard and actual referrals
SELECT
    l.user_id,
    p.name,
    l.referrals as leaderboard_count,
    COUNT(r.id) as actual_count,
    l.referrals - COUNT(r.id) as difference
FROM private.leaderboard_referrals_all_time l
JOIN profiles p ON p.id = l.user_id
LEFT JOIN referrals r ON r.referrer_id = l.user_id
GROUP BY l.user_id, p.name, l.referrals
HAVING l.referrals != COUNT(r.id)
ORDER BY difference DESC;

-- Should return 0 rows after fix is deployed
```

---

## Issue 2: Tag Registration Verifications

### Location
- **Function**: `insert_tag_registration_verifications()`
- **Schema File**: `supabase/schemas/distributions.sql` (lines 493-546)

### Current Behavior

This function creates verifications for users who **paid** for tags during distribution calculation.

**Key SQL Logic**:
```sql
SELECT
    t.user_id,
    'tag_registration'::verification_type,
    jsonb_build_object('tag', t.name) AS metadata,
    CASE
        WHEN LENGTH(t.name) >= 6 THEN 1
        WHEN LENGTH(t.name) = 5 THEN 2
        WHEN LENGTH(t.name) = 4 THEN 3
        WHEN LENGTH(t.name) > 0  THEN 4
        ELSE 0
    END AS weight
FROM tags t
WHERE t.user_id IS NOT NULL      -- ← Excludes deleted users
  AND t.status = 'confirmed'
  AND r.user_id = t.user_id       -- Ensure receipt belongs to current owner
```

**On User Deletion**:
- Tags have `user_id` set to NULL (via `tags.user_id → auth.users(id) ON DELETE CASCADE`)
- Tag record itself is NOT deleted (tag becomes "available" for purchase)
- Function filters `WHERE t.user_id IS NOT NULL`
- No verifications created for deleted users' tags

### Analysis

✅ **NO ACTION NEEDED**

**Why no action is needed**:
1. **Future distributions**: Function already filters out NULL user_id, so deleted users won't get verifications
2. **Historical distributions**: Existing verifications in closed distributions remain unchanged (historical data preserved)
3. **Weight is static**: Based on tag length only, not dependent on user activity
4. **No recalculation needed**: Tag registration verifications are created once and never updated

### Verification Query

```sql
-- Verify no tag_registration verifications exist for deleted users
-- (Should only find verifications in closed distributions, if any)
SELECT
    dv.id,
    dv.distribution_id,
    d.number as distribution_number,
    dv.metadata->>'tag' as tag_name,
    CASE
        WHEN d.qualification_end < NOW() THEN 'CLOSED'
        ELSE 'ACTIVE'
    END as distribution_status
FROM distribution_verifications dv
JOIN distributions d ON d.id = dv.distribution_id
WHERE dv.type = 'tag_registration'
  AND dv.user_id NOT IN (SELECT id FROM auth.users);
```

---

## Issue 3: Tag Referral Verifications

### Location
- **Table**: `distribution_verifications` with type `tag_referral`
- **Creation Trigger**: `insert_verification_referral` (referrals.sql:203-248)
- **Update Function**: `update_referral_verifications()` (distributions.sql:801-866)

### Current Behavior

**When Referral is Created**:
```sql
-- Trigger: insert_verification_referral
-- Fires: AFTER INSERT ON public.referrals
INSERT INTO distribution_verifications(
    distribution_id,
    user_id,
    type,
    metadata,
    weight
) VALUES (
    curr_distribution_id,
    NEW.referrer_id,
    'tag_referral',
    jsonb_build_object('referred_id', NEW.referred_id),
    0  -- Initial weight is 0 (not yet qualified)
);
```

**Weight Calculation Logic**:
```sql
-- From insert_tag_referral_verifications()
weight = CASE
    WHEN EXISTS (
        SELECT 1 FROM distribution_shares ds
        WHERE ds.user_id = referrals.referred_id
          AND ds.distribution_id = prev_dist_id  -- Previous distribution
          AND ds.amount > 0
    ) THEN 1
    ELSE 0
END
```

**On Referred User Deletion**:
- Referral record CASCADE deleted
- `tag_referral` verification remains in database temporarily
- Metadata still contains deleted user's ID: `{"referred_id": "<uuid>"}`
- Weight remains unchanged until next distributor run

### Automatic Cleanup by Distributor

✅ **NO MANUAL CLEANUP NEEDED**

**How it's handled**:
1. **Distributor service**: Runs every hour (or 50 seconds in development)
2. **Location**: `apps/distributor/src/distributorv2.ts:846`
3. **Function**: Calls `update_referral_verifications()` during each run
4. **Behavior**: Recalculates all tag_referral weights based on current referrals
   - If referral record exists and referred user has shares: weight = 1
   - If referral record is deleted: weight = 0 (no matching referral)

**Weight Recalculation Logic** (distributions.sql:818-828):
```sql
UPDATE distribution_verifications dv
SET weight = CASE
    WHEN ts.user_id IS NOT NULL AND ts.amount > 0 THEN 1
    ELSE 0
END
FROM referrals r
LEFT JOIN temp_shares ts ON ts.user_id = r.referred_id
WHERE dv.distribution_id = $1
AND dv.type = 'tag_referral'
AND dv.user_id = r.referrer_id
AND (dv.metadata->>'referred_id')::uuid = r.referred_id;
```

**Why this approach is better**:
- **Automatic**: No trigger needed, distributor handles it naturally
- **Consistent**: Uses same logic as distribution calculation
- **Fast recovery**: Maximum staleness is 1 hour (production) or 50 seconds (dev)
- **Historical preservation**: Closed distributions remain unchanged
- **Simpler**: One less trigger to maintain and test

---

## Issue 4: Total Referrals Verifications (Current Distribution)

### Location
- **Table**: `distribution_verifications` with type `total_tag_referrals`
- **Creation Function**: `insert_total_referral_verifications()` (distributions.sql:549-607)
- **Update Function**: `update_referral_verifications()` (distributions.sql:801-868)

### Current Behavior

**Weight Calculation**:
```sql
-- From insert_total_referral_verifications()
WITH total_referrals AS (
    SELECT
        r.referrer_id,
        COUNT(*) FILTER (WHERE EXISTS (
            SELECT 1 FROM distribution_shares ds
            WHERE ds.user_id = r.referred_id
              AND ds.distribution_id = prev_dist_id
              AND ds.amount > 0
        )) AS qualified_referrals
    FROM referrals r
    WHERE r.created_at <= qual_end
    GROUP BY r.referrer_id
)
INSERT INTO distribution_verifications (weight)
SELECT qualified_referrals FROM total_referrals;
```

**Key Point**: This is an **aggregate count** of all qualified referrals for a referrer.

**On Referred User Deletion**:
- Referral record CASCADE deleted
- `total_tag_referrals` verification weight remains temporarily stale
- Weight no longer matches actual count until next distributor run

### Automatic Cleanup by Distributor

✅ **NO MANUAL CLEANUP NEEDED**

**How it's handled**:
1. **Distributor service**: Runs every hour (or 50 seconds in development)
2. **Location**: `apps/distributor/src/distributorv2.ts:846`
3. **Function**: Calls `update_referral_verifications()` during each run
4. **Behavior**: Recalculates all total_tag_referrals weights based on current referrals and shares

**Weight Recalculation Logic** (distributions.sql:848-862):
```sql
-- Update existing total_tag_referrals (only count shares with amount > 0)
UPDATE distribution_verifications dv
SET weight = rc.referral_count
FROM (
    SELECT
        r.referrer_id,
        COUNT(ts.user_id) as referral_count
    FROM referrals r
    JOIN temp_shares ts ON ts.user_id = r.referred_id
    WHERE ts.amount > 0
    GROUP BY r.referrer_id
) rc
WHERE dv.distribution_id = $1
AND dv.type = 'total_tag_referrals'
AND dv.user_id = rc.referrer_id;
```

**How it handles deleted users**:
- Deleted referral records won't match in the JOIN
- COUNT will automatically reflect only existing referrals
- Weight is recalculated to match current state

**Why this approach is better**:
- **Automatic**: No trigger needed, distributor handles it naturally
- **Consistent**: Uses same logic as distribution calculation
- **Fast recovery**: Maximum staleness is 1 hour (production) or 50 seconds (dev)
- **Accurate**: Counts based on current referrals and shares
- **Historical preservation**: Closed distributions remain unchanged
- **Simpler**: One less trigger to maintain and test

---

## Implementation Plan

### Step 1: Add Leaderboard Decrement Trigger

**File**: `supabase/schemas/referrals.sql` and migration `20251127111203_referrals_triggers_on_account_delete.sql`

```sql
-- Function to decrement leaderboard referrals count
CREATE OR REPLACE FUNCTION private.decrement_leaderboard_referrals_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE private.leaderboard_referrals_all_time
    SET referrals = GREATEST(0, referrals - 1),
        updated_at = now()
    WHERE user_id = OLD.referrer_id;
    RETURN OLD;
END;
$$;

-- Trigger to decrement referral count on delete
CREATE TRIGGER decrement_leaderboard_referrals
AFTER DELETE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION private.decrement_leaderboard_referrals_on_delete();
```

### Step 2: Distribution Verifications

**No additional implementation needed!**

Distribution verifications are automatically handled by the distributor service:
- **Service**: `apps/distributor`
- **Runs**: Every hour (production) or 50 seconds (development)
- **Function**: `update_referral_verifications()` recalculates all weights
- **Effect**: Deleted referrals are naturally excluded from the count

### Step 3: Create Tests

**File**: `supabase/tests/account_deletion_referrals_test.sql`

Tests cover:
- Leaderboard increment and decrement scenarios
- Multiple referrals and sequential deletions
- Edge cases (zero count, negative prevention)
- Transaction safety

---

## Testing Strategy

### Test Categories

1. **Unit Tests** (pgTAP)
   - Test leaderboard trigger functionality
   - Test edge cases and error conditions
   - Test concurrent operations

2. **Integration Tests**
   - Test complete account deletion flow
   - Verify CASCADE timing
   - Verify leaderboard consistency

3. **Data Validation**
   - Post-deployment queries to verify data consistency
   - Monitor distributor runs for verification updates

### Test Execution Order

```bash
# 1. Run local tests
cd supabase
yarn supabase reset
yarn supabase test

# 2. Verify leaderboard trigger works
# 3. Monitor distributor logs for verification updates
```

---

## Data Validation Queries

### Leaderboard Consistency Check

```sql
-- Find mismatches between leaderboard and actual referrals
SELECT
    l.user_id,
    p.name,
    l.referrals as leaderboard_count,
    COUNT(r.id) as actual_count,
    l.referrals - COUNT(r.id) as difference
FROM private.leaderboard_referrals_all_time l
JOIN profiles p ON p.id = l.user_id
LEFT JOIN referrals r ON r.referrer_id = l.user_id
GROUP BY l.user_id, p.name, l.referrals
HAVING l.referrals != COUNT(r.id)
ORDER BY difference DESC;

-- Expected: 0 rows (no mismatches)
```

### Distribution Verifications

Distribution verifications are automatically maintained by the distributor service. No manual validation needed - the hourly distributor run ensures weights are always up-to-date with current referrals and shares.

---

## Deployment Checklist

### Pre-Deployment

- [x] All pgTAP tests pass locally (8 tests)
- [x] Schema changes reviewed by team
- [x] Performance impact assessed (negligible)
- [x] Migration created and tested

### Deployment

- [x] Deploy leaderboard trigger
- [x] Verify no errors in logs
- [x] Run validation queries
- [x] Test account deletion flow

### Post-Deployment

- [x] Run leaderboard validation query
- [x] Verify distributor continues to run normally
- [x] Completed: 2025-11-27

---

## Performance Considerations

### Trigger Performance

**Leaderboard Decrement Trigger**:
- Single UPDATE by primary key (user_id)
- Very fast (<1ms)
- No performance concerns
- Executes on referral deletion (CASCADE from user deletion)

**Indexes Used**:
```sql
-- Existing indexes that support leaderboard trigger:
leaderboard_referrals_all_time (user_id) -- PRIMARY KEY
referrals (referrer_id)
referrals (referred_id)
```

### Monitoring

Monitor:
1. Leaderboard consistency (validation query)
2. Distributor runs (logs at `apps/distributor`)
3. No errors on account deletion

---

## Rollback Procedures

### If Issues Detected

**Immediate Rollback**:
```sql
-- Drop the leaderboard trigger
DROP TRIGGER IF EXISTS decrement_leaderboard_referrals ON public.referrals;

-- Function remains but is harmless without trigger
```

**Partial Rollback** (after some deletions):
```sql
-- Option 1: Disable trigger temporarily
ALTER TABLE public.referrals DISABLE TRIGGER decrement_leaderboard_referrals;

-- Option 2: Recalculate leaderboard counts manually
WITH actual_counts AS (
    SELECT
        referrer_id,
        COUNT(*) as count
    FROM referrals
    GROUP BY referrer_id
)
UPDATE private.leaderboard_referrals_all_time l
SET referrals = COALESCE(ac.count, 0),
    updated_at = now()
FROM actual_counts ac
WHERE l.user_id = ac.referrer_id;
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Trigger performance impact | Very Low | Low | Simple single UPDATE by primary key |
| Incorrect leaderboard counts | Low | Medium | Comprehensive pgTAP tests + validation query |
| CASCADE timing issues | Very Low | Medium | Trigger on referrals table (after CASCADE) |
| Concurrent deletion race conditions | Very Low | Low | Database transaction isolation handles this |

---

## Future Considerations

### Potential Enhancements

1. **Audit Log**: Track all account deletions and referral impacts
2. **Analytics**: Track reasons for account deletion and referral churn
3. **Soft Delete**: Consider soft-delete approach for referrals (currently not needed)

### Maintenance

1. **Quarterly Review**: Run leaderboard validation query
2. **Monitor Distributor**: Ensure verification updates continue working correctly
3. **Track Trends**: Monitor account deletion rates and referral impact

---

## References

### Related Files
- `supabase/schemas/referrals.sql` - Referrals table, leaderboard, and decrement trigger
- `supabase/migrations/20251127111203_referrals_triggers_on_account_delete.sql` - Migration
- `supabase/tests/account_deletion_referrals_test.sql` - Test suite (8 tests)
- `supabase/schemas/distributions.sql` - Distribution verifications functions
- `apps/distributor/src/distributorv2.ts` - Distributor service (handles verifications)

### Related Documentation
- [Account Deletion Implementation](./account-deletion-implementation.md) - Main documentation

### Database Schema References
- Foreign Key: `referrals.referrer_id → profiles.id ON DELETE CASCADE`
- Foreign Key: `referrals.referred_id → profiles.id ON DELETE CASCADE`
- Foreign Key: `leaderboard_referrals_all_time.user_id → auth.users(id) ON DELETE CASCADE`

### Key Functions
- `private.decrement_leaderboard_referrals_on_delete()` - Decrements leaderboard count
- `public.update_referral_verifications()` - Recalculates verification weights (called by distributor)

---

*Document created: 2025-11-26*
*Last updated: 2025-11-27*
*Simplified: 2025-11-27 - Removed manual verification cleanup (handled by distributor)*
