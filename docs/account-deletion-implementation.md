# Account Deletion Implementation

## Overview

This document outlines the implementation plan for user account deletion functionality to comply with Apple App Store requirements (Guideline 5.1.1(v) - Data Collection and Storage).

## Apple's Requirements

Apple requires apps that support account creation to also offer account deletion. Key requirements:

- **No temporary deactivation**: Only offering to temporarily deactivate or disable an account is insufficient
- **Complete deletion**: Users must be able to permanently delete their accounts
- **In-app option**: Deletion must be initiated from within the app
- **Confirmation allowed**: Apps may include confirmation steps to prevent accidental deletion
- **No unnecessary barriers**: Apps cannot require phone calls or emails to complete deletion (except in highly-regulated industries)

Reference: [Apple's Account Deletion Requirements](https://developer.apple.com/support/offering-account-deletion-in-your-app)

## Database Schema Analysis

### Tables Potentially Containing User Data

**Note**: This list excludes:
- Regular views (automatically reflect changes in underlying tables)
- Infrastructure tables without user data (challenges, distributions config, liquidity pools, swap routers, shovel indexer infrastructure)

| Name | Type | Schema | Cascades on User Delete? | Need Action |
|------|------|--------|--------------------------|-------------|
| activity | Table | public | ✅ Yes (direct) | ⚠️ **Action required - Hybrid approach** |
| affiliate_stats | Table | public | ✅ Yes (via profiles) | ✅ No action needed |
| canton_party_verifications | Table | public | ✅ Yes (direct) | ✅ No action needed |
| chain_addresses | Table | public | ✅ Yes (direct) | ✅ No action needed |
| distribution_shares | Table | public | ✅ Yes (direct) | ✅ No action needed |
| distribution_verifications | Table | public | ✅ Yes (direct) | ⚠️ **See Referrals Impact** |
| link_in_bio | Table | public | ✅ Yes (direct) | ✅ No action needed |
| profiles | Table | public | ✅ Yes (direct) | ✅ No action needed |
| receipts | Table | public | ✅ Yes (direct) | ✅ No action needed |
| referrals | Table | public | ✅ Yes (via profiles) | ⚠️ **Action required** |
| send_account_credentials | Table | public | ✅ Yes (via send_accounts) | ✅ No action needed |
| send_account_tags | Table | public | ✅ Yes (via send_accounts) | ✅ No action needed |
| send_accounts | Table | public | ✅ Yes (direct) | ✅ No action needed |
| tag_receipts | Table | public | ✅ Yes (via tags) | ✅ No action needed |
| tags | Table | public | ✅ Yes (direct) | ✅ No action needed |
| leaderboard_referrals_all_time | Table | private | ✅ Yes (direct) | ⚠️ **Action required** |
| send_account_transfers | Table | temporal | ❌ No (temporal data) | ⚠️ Manual deletion required |
| send_earn_deposits | Table | temporal | ✅ Yes (via activity) | ✅ No action needed |
| send_scores_history | Materialized View | private | ✅ Yes (derived from user data) | ✅ No action needed |
| webauthn_credentials | Table | public | ✅ Yes (direct) | ✅ No action needed |

**Summary**:
- **Verified CASCADE**: 17 tables with confirmed CASCADE relationships (no special handling needed)
- **Hybrid approach required**: 1 table (activity - preserve multi-user transactions, CASCADE solo activities)
- **Manual deletion required**: 1 table (temporal.send_account_transfers - contains user_id without FK constraint)
- **Referrals impact**: 3 items require special handling (referrals table, distribution_verifications, leaderboard)

**Note**: 15 blockchain indexer tables (send_account_created, send_account_receives, send_token_transfers, sendtag_checkout_receipts, etc.) have been excluded from this list as they only store blockchain addresses with no direct user foreign keys. The connection between users and addresses is severed when chain_addresses and send_accounts cascade on user deletion.

**CASCADE Chain Explanation**:
- **Direct**: Foreign key directly references `auth.users(id)` with `ON DELETE CASCADE`
- **Via profiles**: References `profiles.id` → cascades through `profiles` table
- **Via send_accounts**: References `send_accounts` → cascades through `send_accounts` table
- **Via tags**: References `tags` → cascades through `tags` table

## Deletion Strategy

### Approach: Full Account Deletion

We will implement **complete account deletion** from the Supabase `auth.users` table, which will trigger CASCADE deletes across all related tables.

### Rationale

1. **Apple Compliance**: Apple explicitly requires actual deletion, not temporary deactivation
2. **Existing Architecture**: Database is already designed with CASCADE constraints for this purpose
3. **Blockchain Immutability**: Actual transaction data remains on-chain as the source of truth
4. **Privacy Best Practices**: Full deletion aligns with GDPR and user privacy rights
5. **Simplicity**: Leveraging CASCADE is cleaner than complex anonymization logic

### What Gets Deleted

When a user initiates account deletion:

✅ **Personal Identifiable Information (PII)**
- Profile data (name, avatar, about, birthday, etc.)
- Authentication credentials (passkeys, webauthn)
- Sendtags
- Internal account records

✅ **User Activity Data**
- Activity feed
- Receipts and transaction metadata
- Distribution verifications
- Referral data

✅ **Associated Records**
- Link in bio
- Canton party verifications
- Chain address mappings

### What Remains

⛓️ **Blockchain Data** (immutable and public)
- On-chain transactions
- Smart contract state
- Token balances and transfers

📊 **Indexer Data** (can be re-indexed if needed)
- `sendtag_checkout_receipts` (no user_id, sourced from blockchain)
- Other shovel-indexed data

## Referrals & Distribution Verifications Impact

### Overview

When a referred user deletes their account, this has cascading effects on the referrer's data and distribution verifications. **Analysis completed and fixes implemented** ✅

### Summary of Implementation

| Issue | Component | Status | Solution |
|-------|-----------|--------|----------|
| 1 | Leaderboard referral counts | ✅ FIXED | DELETE trigger implemented |
| 2 | Tag registration verifications | ✅ No action needed | Already handles correctly |
| 3 | Tag referral verifications | ✅ No action needed | Distributor service handles automatically |
| 4 | Total referrals verifications | ✅ No action needed | Distributor service handles automatically |

### Key Findings

**Issue 1: Leaderboard Referral Counts** (✅ FIXED)
- **Problem**: Referral count incremented on INSERT but never decremented on DELETE
- **Impact**: Leaderboard would become permanently inflated over time
- **Solution**: Implemented `decrement_leaderboard_referrals_on_delete()` trigger
- **Migration**: `20251127194424_referrals_triggers_on_account_delete.sql`
- **Tests**: 8 pgTAP tests in `account_deletion_referrals_test.sql` - all passing ✅

**Issues 2-4: Distribution Verifications** (✅ No Action Needed)
- **Discovery**: Distributor service (`apps/distributor/src/distributorv2.ts:846`) runs hourly
- **Automatic handling**: Calls `update_referral_verifications()` which:
  - Recalculates all `tag_referral` and `total_tag_referrals` weights
  - Automatically excludes deleted referrals (CASCADE deleted from database)
  - Uses current referrals and shares to compute accurate weights
- **Maximum staleness**: 1 hour (production) / 50 seconds (dev)
- **Process**: When user deletes account → referrals CASCADE delete → next distributor run corrects weights

### Implementation Details

**Trigger Function** (`private.decrement_leaderboard_referrals_on_delete`)
- Fires AFTER DELETE on `public.referrals` table
- Decrements referrer's count in `private.leaderboard_referrals_all_time`
- Uses `GREATEST(0, referrals - 1)` to prevent negative counts
- Updates `updated_at` timestamp

**Test Coverage** (`supabase/tests/account_deletion_referrals_test.sql`)
1. Leaderboard increments on referral creation
2. Leaderboard decrements on referred user deletion
3. Multiple referrals handling (3 referrals → delete 1 → verify count)
4. Sequential deletions (3 → 2 → 1 → 0)
5. Complete deletion to zero
6. Edge case: count never goes negative
7. Concurrent deletion safety

### Key Principles

1. **Leaderboard**: Real-time updates via DELETE trigger
2. **Distribution verifications**: Hourly updates via distributor service
3. **Historical data**: Closed distributions remain unchanged
4. **CASCADE deletes**: Automatic cleanup of referral records

## Activity Table Impact

### Overview

The activity table contains transaction history and user activities. When a user deletes their account, we need to preserve transaction history for other users while cleaning up solo activities. **Analysis completed and fixes implemented** ✅

### Summary of Implementation

| Activity Type | Behavior | Status |
|--------------|----------|--------|
| Multi-user transfers | Preserved with NULL | ✅ FIXED |
| Multi-user receives | Preserved with NULL | ✅ FIXED |
| Temporal transfers | Preserved with NULL | ✅ FIXED |
| Referrals | CASCADE deleted | ✅ Handled by referrals CASCADE chain |
| Tag purchases (solo) | CASCADE deleted | ✅ No action needed |
| Earn deposits (solo) | CASCADE deleted | ✅ No action needed |
| Self-transfers | CASCADE deleted | ✅ No action needed |

### Problem Statement

**Challenge**: The activity table has CASCADE delete on `from_user_id` and `to_user_id`, which would delete ALL activities when a user is deleted. However:
- Bob sends $100 to Alice → Both have activity records
- If Alice deletes her account, Bob should still see "Sent $100 to [Deleted User]"
- But with pure CASCADE, Bob's activity would be deleted too (broken transaction history)

**Solution**: Hybrid trigger + CASCADE approach
- BEFORE user deletion: Set user_id to NULL for multi-user transaction activities
- Allow CASCADE to clean up solo activities (tags, earn deposits, referrals)

### Implementation Details

**Trigger Function** (`public.preserve_activity_before_user_deletion()`)
- Fires: BEFORE DELETE on `auth.users`
- Updates: `from_user_id` or `to_user_id` to NULL for transaction activities
- Scope: Only transaction event types (`send_account_transfers`, `send_account_receives`, `temporal_send_account_transfers`)
- Conditions:
  - Only preserves if "other user" exists and is different from deleted user
  - Excludes referrals (handled by separate CASCADE chain via `profiles` → `referrals` → activity)
  - Self-transfers are CASCADE deleted (same user for both from/to)

**Migration**: `20251128102256_activity_triggers_on_account_delete.sql`

### Behavior Examples

**Example 1: Multi-user Transfer (Preserved)**
```
Before deletion:
- Activity: from_user_id=Alice, to_user_id=Bob, event_name='send_account_transfers'

Alice deletes account:
- Activity: from_user_id=NULL, to_user_id=Bob, event_name='send_account_transfers'
- Bob still sees: "Received $100 from [Deleted User]" ✅
```

**Example 2: Solo Activity (CASCADE Deleted)**
```
Before deletion:
- Activity: from_user_id=Alice, to_user_id=NULL, event_name='tag_receipt_usdc'

Alice deletes account:
- Activity: DELETED by CASCADE ✅
- No other user involved, so no need to preserve
```

**Example 3: Referral (CASCADE Deleted)**
```
Before deletion:
- Referral: referrer_id=Alice, referred_id=Bob
- Activity: from_user_id=Alice, to_user_id=Bob, event_name='referrals'

Bob deletes account:
- Profile CASCADE deletes → Referral CASCADE deleted → Activity CASCADE deleted ✅
- Alice loses referral credit (as intended)
- Leaderboard decrements via trigger (Phase 0)
```

**Example 4: Self-transfer (CASCADE Deleted)**
```
Before deletion:
- Activity: from_user_id=Alice, to_user_id=Alice, event_name='send_account_transfers'

Alice deletes account:
- Activity: DELETED by CASCADE ✅
- No "other user" to preserve for (from_user != to_user condition fails)
```

### Test Coverage

Three comprehensive test files with 29 total tests:

**1. Preservation Tests** (`supabase/tests/activity_account_deletion_preservation_test.sql` - 12 tests)
- Multi-user transfer preservation with NULL from_user_id
- Multi-user receive preservation with NULL to_user_id
- Temporal transfer preservation
- Solo activity CASCADE deletion (tags, earn deposits)
- Data integrity verification
- Profile CASCADE behavior
- Total activity counts

**2. Edge Cases** (`supabase/tests/activity_account_deletion_edge_cases_test.sql` - 11 tests)
- Self-transfers (same user for from/to) → CASCADE deleted
- Multiple activities between same users → All preserved
- Activity chains involving multiple users → Preserved correctly
- Mix of different event types → Each handled correctly
- Activities with already-NULL user fields → Stable behavior
- Backfill resilience (UPSERT pattern prevents duplicates)

**3. Referral Integration** (`supabase/tests/activity_account_deletion_referrals_test.sql` - 6 tests)
- Referral CASCADE deletion through profiles → referrals → activity chain
- Referrer profile preservation
- Activity cleanup verification
- Integration with Phase 0 referrals fixes

### Frontend Compatibility

✅ **No frontend changes required**
- Activity components already support nullable `from_user_id` and `to_user_id` fields
- Display logic already handles "[Deleted User]" or similar placeholders
- Tested in existing codebase

### Key Technical Details

1. **Trigger timing**: BEFORE DELETE ensures user ID is still available in WHERE clauses
2. **Other user check**: Only preserves when `to_user_id != OLD.id` (or `from_user_id != OLD.id`)
3. **Referral exclusion**: Referrals explicitly excluded from preservation (separate CASCADE chain)
4. **CASCADE cleanup**: Solo activities automatically cleaned up by existing CASCADE behavior
5. **Backfill safety**: UPSERT pattern in activity creation prevents duplicate preservation
6. **NULL support**: Frontend already supports NULL user fields (verified in existing code)

### Key Principles

1. **Preserve transaction history**: Other users shouldn't lose their transaction records
2. **Clean up solo activities**: No orphaned data for single-user activities
3. **Respect referral chain**: Referrals handled by existing CASCADE chain (intentional deletion)
4. **Leverage CASCADE**: Use existing CASCADE for cleanup, trigger only for preservation
5. **Self-contained transactions**: Self-transfers are solo activities (CASCADE deleted)

## Revenue Sharing Impact

The app has revenue sharing mechanisms where referrers earn a percentage of revenue generated by their referred users. We need to ensure that when a referrer deletes their account, the app receives 100% of the revenue instead of losing the referrer's share.

### Sendtag Purchase Revenue Sharing (25% to Referrer)

**How it works:**
1. User purchases a sendtag → Frontend calls `useSendtagCheckout()`
2. Referrer lookup → `useReferrer()` calls `referrer_lookup()` database function
3. Address retrieval → `referrer_lookup()` uses `profile_lookup()` to get the referrer's blockchain address from `send_accounts.address`
4. Smart contract call → `SendtagCheckout.checkout(amount, referrerAddress, reward)` sends 25% directly to referrer's blockchain address
5. Revenue split: Referrer gets 25%, App gets 75%

**When referrer deletes account:**

✅ **SAFE - App receives full price**

1. `send_accounts` CASCADE deleted (foreign key: `ON DELETE CASCADE`)
2. `referrer_lookup()` returns NULL (no matching `send_accounts` row)
3. Frontend uses `zeroAddress` (0x0000...0000) as fallback (`checkout-utils.ts:85`)
4. Reward calculation returns `0n` when referrer is NULL (`checkout-utils.ts:33`)
5. Smart contract called with:
   - `amount` = full price (e.g., 4 USDC)
   - `referrerAddress` = `0x0000...0000`
   - `reward` = `0` (zero)
6. Smart contract skips referrer payment (`if (reward > 0)` is false)
7. App receives full amount: `amount - reward` = `amount - 0` = **100% of price**

**Result:**
- Referrer gets: 0 USDC (no payment sent)
- App gets: 100% of price (instead of 75%)
- No money is lost or sent to invalid addresses
- Transaction succeeds without errors

**Key files:**
- Smart contract: `packages/contracts/src/SendtagCheckout.sol:601-618`
- Frontend logic: `packages/app/features/account/sendtag/checkout/checkout-utils.ts:28-38,85`
- Database function: `supabase/schemas/referrals.sql:587-629` (`referrer_lookup`)
- Reward calculation: `packages/app/data/sendtags.ts:42-55`

## Compliance Considerations

### Financial Record Retention

**Question**: Should we retain receipts for tax/AML compliance?

**Answer**: No, for the following reasons:

1. **Blockchain = Audit Trail**: All actual financial transactions are permanently recorded on the public blockchain
2. **Re-indexable**: Our indexer data can be rebuilt from blockchain history if needed for audits
3. **Industry Practice**: Most crypto apps rely on blockchain as the source of truth and allow full deletion of internal records
4. **Apple's Intent**: Apple focuses on PII and user data control, not blockchain transaction history
5. **Simplicity**: Full deletion via CASCADE is cleaner and more maintainable

### Legal Considerations

- **Tax Compliance**: Blockchain provides permanent record of transactions
- **AML/KYC**: If needed in future, can be handled separately from user data
- **Right to Deletion**: GDPR and similar regulations support user's right to delete personal data
- **Blockchain Exception**: Immutable blockchain data is generally exempt from deletion requirements

## Implementation Plan

### Phase 0: Referrals & Distribution Verifications Fixes ✅ COMPLETED

Analysis completed and fixes implemented for referral system to handle account deletions correctly.

**Pull Request**: [#2252 - Account deletion: referrals impact](https://github.com/0xsend/sendapp/pull/2252)

#### Implementation Summary

**1. Leaderboard Decrement Trigger** ✅ IMPLEMENTED
- Function: `private.decrement_leaderboard_referrals_on_delete()`
- Trigger: AFTER DELETE on `public.referrals`
- Migration: `20251127194424_referrals_triggers_on_account_delete.sql`
- Purpose: Decrements referral count when a referral is deleted
- Safety: Uses `GREATEST(0, referrals - 1)` to prevent negative counts

**2. Distribution Verification Cleanup** ✅ NO ACTION NEEDED
- Discovery: Distributor service already handles this automatically
- Service: `apps/distributor/src/distributorv2.ts:846`
- Runs: Hourly (production) / 50 seconds (dev)
- Function: `update_referral_verifications()` recalculates weights based on current referrals
- Result: Deleted referrals are automatically excluded in next distributor run

**3. Comprehensive Tests** ✅ IMPLEMENTED
- File: `supabase/tests/account_deletion_referrals_test.sql`
- Test count: 8 tests covering all scenarios
- Status: All tests passing ✅
- Coverage: Leaderboard increment/decrement, multiple referrals, sequential deletions, edge cases

### Phase 0.5: Activity Table Handling ✅ COMPLETED

Analysis completed and fixes implemented for activity table to handle account deletions correctly using a hybrid trigger + CASCADE approach.

**Pull Request**: [#2264 - Account deletion: activity impact](https://github.com/0xsend/sendapp/pull/2264)

#### Implementation Summary

**Strategy**: Hybrid trigger + CASCADE approach
- Multi-user transactions (transfers/receives) → Preserved with NULL for deleted user
- Referrals → Auto-deleted via existing CASCADE chain (intentional)
- Solo activities (tags, earn deposits) → CASCADE deleted (no orphaned data)

**1. Activity Preservation Trigger** ✅ IMPLEMENTED
- Function: `public.preserve_activity_before_user_deletion()`
- Trigger: BEFORE DELETE on `auth.users`
- Migration: `20251128102256_activity_triggers_on_account_delete.sql`
- Purpose: Sets `from_user_id` or `to_user_id` to NULL for multi-user transaction activities
- Scope: Only applies to transaction event types (`send_account_transfers`, `send_account_receives`, `temporal_send_account_transfers`)
- Preserves: Activities where another user (sender or recipient) exists and is different from deleted user

**2. Behavior by Activity Type**

| Activity Type | Behavior | Rationale |
|--------------|----------|-----------|
| Multi-user transfers | Preserved with NULL | Other user should still see "Received $100 from [Deleted User]" |
| Multi-user receives | Preserved with NULL | Other user should still see their transaction history |
| Temporal transfers | Preserved with NULL | Same as regular transfers |
| Referrals | CASCADE deleted | Handled by existing `profiles` → `referrals` CASCADE chain |
| Tag purchases | CASCADE deleted | Solo activity, no other user involved |
| Earn deposits | CASCADE deleted | Solo activity, no other user involved |
| Self-transfers | CASCADE deleted | Same user for both from/to, no preservation needed |

**3. Comprehensive Tests** ✅ IMPLEMENTED

Three test files with 29 total tests:

- `supabase/tests/activity_account_deletion_preservation_test.sql` (12 tests)
  - Multi-user transfer preservation
  - Multi-user receive preservation
  - Temporal transfer preservation
  - Solo activity CASCADE deletion
  - Data integrity verification

- `supabase/tests/activity_account_deletion_edge_cases_test.sql` (11 tests)
  - Self-transfers (same user for from/to)
  - Multiple activities between same users
  - Activity chains involving multiple users
  - Mix of different event types
  - Activities with already-NULL user fields
  - Backfill resilience (UPSERT pattern)

- `supabase/tests/activity_account_deletion_referrals_test.sql` (6 tests)
  - Referral CASCADE deletion verification
  - Referrer profile preservation
  - Activity cleanup through CASCADE chain

**4. Frontend Compatibility** ✅ VERIFIED
- Frontend activity components already support nullable `from_user_id` and `to_user_id` fields
- No frontend changes required

**5. Key Technical Details**
- Trigger fires BEFORE user deletion, allowing access to user ID in WHERE clauses
- Only updates activities where "other user" exists and is different (`to_user_id != OLD.id`)
- Excludes referrals from preservation logic (handled by separate CASCADE chain)
- Leverages existing CASCADE behavior for cleanup of solo activities
- Backfill-safe: Uses UPSERT pattern in activity creation to prevent duplicates

### Phase 1: Database Function

Create a PostgreSQL function in Supabase:

**File**: `supabase/schemas/account_deletion.sql`

```sql
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get the authenticated user's ID
    current_user_id := auth.uid();

    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to delete account';
    END IF;

    -- Delete the user from auth.users
    -- This will trigger CASCADE deletes across all related tables
    DELETE FROM auth.users WHERE id = current_user_id;

    -- Note: The user's session will be invalidated after this operation
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
```

### Phase 2: tRPC Endpoint

Create a tRPC mutation endpoint:

**File**: `packages/api/src/routers/auth/router.ts`

Add a new procedure:

```typescript
deleteAccount: protectedProcedure
  .mutation(async ({ ctx: { supabase } }) => {
    log('Deleting user account');

    try {
      // Call the database function to delete the account
      const { error } = await supabase.rpc('delete_user_account');

      if (error) {
        throw new Error(error.message || 'Failed to delete account');
      }

      // Sign out the user
      await supabase.auth.signOut();

      return { success: true };
    } catch (error) {
      log('Error deleting account: ', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to delete account: ${error.message}`,
      });
    }
  })
```

### Phase 3: Frontend Integration

The mobile app will need to:

1. Add a "Delete Account" option in settings
2. Show confirmation dialog explaining the consequences
3. Call the tRPC endpoint
4. Handle successful deletion (clear local state, navigate to welcome screen)
5. Handle errors appropriately

### Phase 4: Testing

Create tests to verify:

1. **Database Function Tests** (`supabase/tests/account_deletion_test.sql`)
   - User can delete their own account via `delete_user_account()` function
   - All related data is cascaded properly
   - User cannot delete while unauthenticated
   - Verify all CASCADE relationships work correctly
   - Test referral cleanup triggers fire correctly
   - Test distribution verification updates

2. **Referrals System Tests** (`supabase/tests/account_deletion_referrals_test.sql`)
   - Already created in Phase 0 (see above)
   - Run these tests first to validate Phase 0 fixes

3. **Activity Table Tests** ✅ COMPLETED IN PHASE 0.5
   - Already created in Phase 0.5 (see above)
   - `supabase/tests/activity_account_deletion_preservation_test.sql` (12 tests)
   - `supabase/tests/activity_account_deletion_edge_cases_test.sql` (11 tests)
   - `supabase/tests/activity_account_deletion_referrals_test.sql` (6 tests)

4. **tRPC Endpoint Tests** (`packages/api/`)
   - Authenticated user can delete account
   - Unauthenticated request fails
   - Session is invalidated after deletion
   - Error handling works correctly

5. **Integration Tests**
   - End-to-end account deletion flow
   - Verify user cannot access data after deletion
   - Verify blockchain data remains accessible on-chain

## Security Considerations

1. **Authentication Required**: User must be authenticated to delete account
2. **Confirmation Step**: UI should require explicit confirmation
3. **Session Invalidation**: User session is terminated after deletion
4. **No Recovery**: Make it clear that deletion is permanent and irreversible
5. **Rate Limiting**: Consider rate limiting to prevent abuse

## Success Criteria

### Core Account Deletion
- ⏳ User can initiate account deletion from mobile app
- ⏳ All personal data is removed from database
- ⏳ Blockchain data remains accessible on-chain
- ⏳ Apple App Store approval obtained
- ⏳ Tests verify complete deletion
- ⏳ No orphaned data remains in database

### Referrals System Integrity (Phase 0) ✅ COMPLETED
- ✅ Leaderboard referral counts accurately reflect current referrals
- ✅ Leaderboard decrements when referred user deletes account
- ✅ Distribution verifications automatically handled by distributor service
- ✅ Closed (historical) distributions remain unchanged
- ✅ No errors when deleting user with no active distribution
- ✅ All pgTAP tests pass for referrals system (8/8 tests passing)

### Activity Table Integrity (Phase 0.5) ✅ COMPLETED
- ✅ Multi-user transactions preserved with NULL for deleted user
- ✅ Other users still see transaction history (e.g., "Received $100 from [Deleted User]")
- ✅ Referral activities properly CASCADE deleted
- ✅ Solo activities (tags, earn deposits) CASCADE deleted
- ✅ Self-transfers properly CASCADE deleted
- ✅ Activity chains with multiple users handled correctly
- ✅ Activities with already-NULL fields remain stable
- ✅ Backfill-resilient (UPSERT pattern prevents duplicates)
- ✅ All pgTAP tests pass for activity handling (29/29 tests passing)

### Testing & Validation
- ✅ Phase 0: Referrals system tests complete and passing (8 tests)
- ✅ Phase 0.5: Activity table tests complete and passing (29 tests)
- ⏳ All pgTAP tests pass for core account deletion function
- ⏳ Data validation queries show no inconsistencies
- ⏳ Staging environment testing completed successfully
- ⏳ Performance impact assessed and acceptable

## References

### External Documentation
- [Apple: Offering Account Deletion in Your App](https://developer.apple.com/support/offering-account-deletion-in-your-app)
- [Supabase Auth: Delete User](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)
- [GDPR Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)

---

*Document created: 2025-11-25*
*Last updated: 2025-11-28*

### Changelog
- **2025-11-28**:
  - Phase 0.5 completed - Activity table preservation logic implemented and tested (29 tests)
  - Phase 0 completed - Referrals system fixes implemented and tested (8 tests)
- **2025-11-26**: Initial implementation plan created
- **2025-11-25**: Document created with database schema analysis
