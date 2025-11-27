# Account Deletion: Referrals & Distribution Verifications Impact

## Overview

This document provides a detailed analysis of how account deletion affects the referrals system and distribution verifications. When a referred user deletes their account, this has cascading effects on the referrer's data and distribution calculations.

## Executive Summary

**Critical Finding**: The current referrals system has **4 issues** that must be fixed before enabling account deletion:

| Issue | Component | Severity | Action Required |
|-------|-----------|----------|-----------------|
| 1 | Leaderboard referral counts | 🔴 CRITICAL | Add DELETE trigger |
| 2 | Tag registration verifications | ✅ None | Already handles correctly |
| 3 | Tag referral verifications | 🟡 MEDIUM | Set weight=0 for current distribution |
| 4 | Total referrals verifications | 🟡 MEDIUM | Recalculate weight for current distribution |

## Key Principles

1. **Historical data preserved**: Closed distributions remain unchanged
2. **Current distribution affected**: Only the active distribution needs adjustment
3. **Future distributions protected**: New distributions won't have referral records for deleted users
4. **Leaderboard reflects current state**: Should show current referrals, not historical

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

## Issue 3: Tag Referral Verifications (Current Distribution)

### Location
- **Table**: `distribution_verifications` with type `tag_referral`
- **Creation Trigger**: `insert_verification_referral` (referrals.sql:203-248)
- **Update Function**: `insert_tag_referral_verifications()` (distributions.sql:438-491)

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
- `tag_referral` verification remains in database
- Metadata still contains deleted user's ID: `{"referred_id": "<uuid>"}`
- Weight remains unchanged (could be 1 even though user is gone)

### Problem Scenario (Current Distribution Only)

```
Distribution Timeline:
  Dist 10: Jan 1-31 (qualification)
  Dist 11: Feb 1-28 (qualification) ← Currently active

Step 1: During Dist 10
  → User A refers User B
  → tag_referral verification created for Dist 10 with weight=0

Step 2: End of Dist 10
  → User B qualifies (sends tokens, gets distribution_shares)
  → Distribution calculation runs
  → Weight updated to 1 for User B's referral

Step 3: Start of Dist 11
  → tag_referral verification created for Dist 11 with weight=1
    (because User B qualified in Dist 10)

Step 4: During Dist 11
  → User B deletes their account
  → Referral record CASCADE deleted
  → tag_referral verification in Dist 11 still exists with weight=1

Step 5: End of Dist 11 (distribution calculation)
  → User A gets distribution share credit for referring User B
  → But User B no longer exists! ← WRONG
```

### Impact Analysis

**Severity**: 🟡 **MEDIUM** - Only affects current/future distributions

**Why Medium (not Critical)**:
- Only affects active distribution (not historical data)
- Self-corrects in future distributions (no referral record = no verification)
- Relatively small impact per user
- Distribution calculations happen monthly (time to catch and fix)

**Scope**:
- Only current distribution period
- Past distributions remain correct (historical data preserved)
- Future distributions will be correct (no referral record to create verification)

### Required Solution

Set weight=0 for tag_referral verifications in **current distribution only** when referred user deletes account.

**Why weight=0 instead of deletion**:
- Preserves referrer's historical activity (they DID refer someone)
- Matches the pattern used for other inactive verifications
- Allows auditing and debugging
- Simpler than deletion (no CASCADE concerns)

### Testing Requirements

1. **Active distribution with tag_referral**
   - Setup: Create distribution, users A and B, referral
   - Create tag_referral verification with weight=1
   - Delete User B
   - Verify: weight changed to 0 in current distribution

2. **Closed distribution unchanged**
   - Setup: Create closed distribution with tag_referral weight=1
   - Delete referred user
   - Verify: weight remains 1 (historical preservation)

3. **No active distribution**
   - Setup: No active distribution
   - Delete referred user
   - Verify: No errors, graceful handling

4. **Multiple referrers affected**
   - User A, B, C all refer User D
   - All have tag_referral verifications for User D
   - Delete User D
   - Verify: All weights set to 0

5. **Multiple referrals by same referrer**
   - User A refers B, C, D
   - Delete User C
   - Verify: Only User C's verification weight=0
   - Verify: User B and D verifications unchanged

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
- `total_tag_referrals` verification weight remains unchanged
- Weight no longer matches actual count

### Problem Scenario (Current Distribution Only)

```
Step 1: User A has referred 5 users (B, C, D, E, F)
  → All 5 qualified in previous distribution
  → total_tag_referrals weight = 5

Step 2: User C deletes their account
  → Referral record for C CASCADE deleted
  → total_tag_referrals weight still = 5 ← WRONG! Should be 4

Step 3: Distribution calculation runs
  → User A gets credit for 5 referrals
  → But only 4 referrals exist
```

### Impact Analysis

**Severity**: 🟡 **MEDIUM** - Only affects current/future distributions

**Why Medium**:
- Only affects active distribution
- Aggregate metric (not individual referral)
- Self-corrects in future distributions
- Distribution calculations happen monthly

**Scope**:
- Only current distribution period
- Affects referrers whose referred users delete accounts
- Past distributions remain correct

### Required Solution

Recalculate `total_tag_referrals` weight for affected referrers in **current distribution only**.

**Calculation Logic**:
```sql
-- Count remaining referrals (excluding deleted user)
new_weight = COUNT(remaining_referrals)
```

### Testing Requirements

1. **Basic recalculation**
   - User A refers 5 users, total_tag_referrals weight=5
   - Delete one referred user
   - Verify: weight=4

2. **Multiple deletions**
   - User A refers 5 users, weight=5
   - Delete 2 referred users
   - Verify: weight=3

3. **Delete all referrals**
   - User A refers 3 users, weight=3
   - Delete all 3 referred users
   - Verify: weight=0

4. **Closed distribution unchanged**
   - Closed distribution has weight=5
   - Delete referred user
   - Verify: weight remains 5

5. **Multiple referrers affected**
   - User A refers B, C, D (weight=3)
   - User E refers B, F (weight=2)
   - Delete User B
   - Verify: User A weight=2, User E weight=1

---

## Implementation Plan

### Step 1: Add Leaderboard Decrement Trigger

**File**: New migration or update `supabase/schemas/referrals.sql`

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

### Step 2: Handle Distribution Verifications on User Deletion

**File**: New migration or `supabase/schemas/account_deletion.sql`

```sql
-- Function to handle distribution verification cleanup on user deletion
CREATE OR REPLACE FUNCTION public.cleanup_referral_verifications_on_user_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_dist_id integer;
BEGIN
    -- Get current distribution (active qualification period)
    SELECT id INTO current_dist_id
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    -- Only proceed if there's an active distribution
    IF current_dist_id IS NOT NULL THEN
        -- Set weight to 0 for tag_referral verifications in current distribution
        -- where the deleted user was the referred user
        UPDATE distribution_verifications dv
        SET weight = 0
        FROM referrals r
        WHERE dv.distribution_id = current_dist_id
          AND dv.type = 'tag_referral'
          AND dv.user_id = r.referrer_id
          AND (dv.metadata->>'referred_id')::uuid = OLD.id;

        -- Recalculate total_tag_referrals for affected referrers
        -- in current distribution
        WITH affected_referrers AS (
            SELECT DISTINCT r.referrer_id
            FROM referrals r
            WHERE r.referred_id = OLD.id
        ),
        referral_counts AS (
            SELECT
                r.referrer_id,
                COUNT(*) FILTER (WHERE r.referred_id != OLD.id) as new_count
            FROM referrals r
            WHERE r.referrer_id IN (SELECT referrer_id FROM affected_referrers)
            GROUP BY r.referrer_id
        )
        UPDATE distribution_verifications dv
        SET weight = COALESCE(rc.new_count, 0)
        FROM referral_counts rc
        WHERE dv.distribution_id = current_dist_id
          AND dv.type = 'total_tag_referrals'
          AND dv.user_id = rc.referrer_id;
    END IF;

    RETURN OLD;
END;
$$;

-- Trigger on profiles deletion (which happens before auth.users CASCADE)
CREATE TRIGGER cleanup_referral_verifications_before_profile_delete
BEFORE DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.cleanup_referral_verifications_on_user_delete();
```

**Critical Design Notes**:
1. **Trigger timing**: BEFORE DELETE on profiles (before referrals CASCADE)
2. **Current distribution only**: Only affects active qualification period
3. **Historical preservation**: Closed distributions remain unchanged
4. **No errors if no distribution**: Gracefully handles case where no active distribution exists

### Step 3: Create Comprehensive Tests

**File**: `supabase/tests/account_deletion_referrals_test.sql`

```sql
BEGIN;
SELECT plan(20); -- Adjust based on final test count

-- Test 1: Leaderboard decrement on referral deletion
-- Test 2: Tag referral verification weight update
-- Test 3: Total referrals verification recalculation
-- Test 4: No active distribution handling
-- Test 5: Closed distribution preservation
-- ... (additional tests)

SELECT * FROM finish();
ROLLBACK;
```

---

## Testing Strategy

### Test Categories

1. **Unit Tests** (pgTAP)
   - Test each trigger independently
   - Test edge cases and error conditions
   - Test concurrent operations

2. **Integration Tests**
   - Test complete account deletion flow
   - Verify all triggers fire in correct order
   - Verify CASCADE timing

3. **Data Validation**
   - Post-deployment queries to verify data consistency
   - Continuous monitoring queries

### Test Execution Order

```bash
# 1. Run local tests
cd supabase
yarn supabase reset
yarn supabase test

# 2. Deploy to staging
yarn supabase db push --staging

# 3. Run staging validation
psql $STAGING_DB_URL -f scripts/validate_referrals.sql

# 4. Deploy to production (if all tests pass)
yarn supabase db push --production

# 5. Monitor production
psql $PROD_DB_URL -f scripts/validate_referrals.sql
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
```

### Distribution Verifications Integrity Check

```sql
-- Find tag_referral verifications referencing deleted users
SELECT
    dv.id,
    dv.distribution_id,
    d.number as dist_num,
    dv.user_id as referrer_id,
    (dv.metadata->>'referred_id')::uuid as referred_id,
    dv.weight,
    CASE
        WHEN d.qualification_end < NOW() THEN 'CLOSED'
        ELSE 'ACTIVE'
    END as status
FROM distribution_verifications dv
JOIN distributions d ON d.id = dv.distribution_id
WHERE dv.type = 'tag_referral'
  AND (dv.metadata->>'referred_id')::uuid NOT IN (
      SELECT id FROM auth.users
  )
ORDER BY d.number DESC;

-- Expected: Only CLOSED distributions, or ACTIVE with weight=0
```

### Total Referrals Verification Check

```sql
-- Verify total_tag_referrals matches actual count
SELECT
    dv.distribution_id,
    d.number as dist_num,
    dv.user_id as referrer_id,
    p.name,
    dv.weight as verification_weight,
    COUNT(r.id) as actual_referrals,
    dv.weight - COUNT(r.id) as difference
FROM distribution_verifications dv
JOIN distributions d ON d.id = dv.distribution_id
JOIN profiles p ON p.id = dv.user_id
LEFT JOIN referrals r ON r.referrer_id = dv.user_id
WHERE dv.type = 'total_tag_referrals'
  AND d.qualification_end >= NOW()  -- Only current/future distributions
GROUP BY dv.distribution_id, d.number, dv.user_id, p.name, dv.weight
HAVING dv.weight != COUNT(r.id)
ORDER BY difference DESC;

-- Expected: 0 rows
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All pgTAP tests pass locally
- [ ] Schema changes reviewed by team
- [ ] Performance impact assessed
- [ ] Rollback plan prepared
- [ ] Staging environment deployed and tested

### Deployment

- [ ] Deploy Step 1: Leaderboard trigger
- [ ] Deploy Step 2: Distribution verification trigger
- [ ] Verify no errors in logs
- [ ] Run validation queries
- [ ] Test account deletion on staging

### Post-Deployment

- [ ] Run all validation queries on production
- [ ] Monitor for 24 hours
- [ ] Create test user and verify deletion flow
- [ ] Document any issues found
- [ ] Update team on completion

---

## Performance Considerations

### Trigger Performance

**Leaderboard Decrement Trigger**:
- Single UPDATE by primary key (user_id)
- Very fast (<1ms)
- No performance concerns

**Distribution Verification Cleanup Trigger**:
- More complex with CTEs and JOINs
- Expected execution time: 10-50ms per user deletion
- Impact: Negligible (account deletions are rare events)

**Indexes Used**:
```sql
-- Existing indexes that support these queries:
distribution_verifications (distribution_id, user_id, type)
referrals (referrer_id)
referrals (referred_id)
distributions (qualification_start, qualification_end)
```

### Monitoring

Add monitoring for:
1. Trigger execution time
2. Number of rows affected per trigger
3. Error rate from triggers

---

## Rollback Procedures

### If Issues Detected

**Immediate Rollback** (before any account deletions):
```sql
-- Drop new triggers
DROP TRIGGER IF EXISTS decrement_leaderboard_referrals ON public.referrals;
DROP TRIGGER IF EXISTS cleanup_referral_verifications_before_profile_delete ON public.profiles;

-- Functions remain but are harmless without triggers
```

**Partial Rollback** (after some deletions):
```sql
-- Option 1: Keep triggers, investigate issues
-- (Recommended if only affecting small number of users)

-- Option 2: Disable triggers temporarily
ALTER TABLE public.referrals DISABLE TRIGGER decrement_leaderboard_referrals;
ALTER TABLE public.profiles DISABLE TRIGGER cleanup_referral_verifications_before_profile_delete;

-- Option 3: Point-in-time recovery (last resort)
-- Contact Supabase support for PITR
```

### Data Repair (if needed)

```sql
-- Recalculate all leaderboard counts
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
| Trigger performance impact | Low | Medium | Test on staging with production-like data |
| Incorrect weight calculations | Medium | High | Comprehensive pgTAP tests + validation queries |
| CASCADE timing issues | Low | High | BEFORE DELETE trigger (before CASCADE) |
| Historical data corruption | Very Low | Critical | Only affects current distribution |
| Concurrent deletion race conditions | Very Low | Medium | Database transaction isolation handles this |
| Missing edge cases in tests | Medium | Medium | Code review + staging testing period |

---

## Future Considerations

### Potential Enhancements

1. **Audit Log**: Track all account deletions and referral impacts
2. **Soft Delete**: Consider soft-delete approach for referrals (discussed and rejected for simplicity)
3. **Analytics**: Track reasons for account deletion and referral churn
4. **Notification**: Notify referrers when referred users delete accounts (privacy concern)

### Maintenance

1. **Quarterly Review**: Check validation queries for any anomalies
2. **Annual Audit**: Full review of referral system integrity
3. **Monitor Trends**: Track account deletion rates and referral impact

---

## References

### Related Files
- `supabase/schemas/referrals.sql` - Referrals table and triggers
- `supabase/schemas/affiliate_stats.sql` - Affiliate statistics
- `supabase/schemas/distributions.sql` - Distribution verifications functions
- `supabase/schemas/profiles.sql` - Profiles table (CASCADE entry point)

### Related Documentation
- [Account Deletion Implementation](./account-deletion-implementation.md) - Main documentation
- [Distribution System](./distribution-system.md) - If exists
- [Referral System](./referral-system.md) - If exists

### Database Schema References
- Foreign Key: `referrals.referrer_id → profiles.id ON DELETE CASCADE`
- Foreign Key: `referrals.referred_id → profiles.id ON DELETE CASCADE`
- Foreign Key: `leaderboard_referrals_all_time.user_id → auth.users(id) ON DELETE CASCADE`
- Foreign Key: `distribution_verifications.user_id → auth.users(id) ON DELETE CASCADE`

---

*Document created: 2025-11-26*
*Last updated: 2025-11-26*
