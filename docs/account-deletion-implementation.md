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
| activity | Table | public | ✅ Yes (direct) | ✅ No action needed |
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
- **Verified CASCADE**: 18 tables with confirmed CASCADE relationships
- **Manual deletion required**: 1 table (temporal.send_account_transfers - contains user_id without FK constraint)
- **Referrals impact**: 3 items require special handling (see detailed analysis below)

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

When a referred user deletes their account, this has cascading effects on the referrer's data and distribution verifications. **Critical issues have been identified** that must be fixed before enabling account deletion.

### Summary of Issues

| Issue | Component | Severity | Action Required |
|-------|-----------|----------|-----------------|
| 1 | Leaderboard referral counts | 🔴 CRITICAL | Add DELETE trigger |
| 2 | Tag registration verifications | ✅ None | Already handles correctly |
| 3 | Tag referral verifications | 🟡 MEDIUM | Set weight=0 for current distribution |
| 4 | Total referrals verifications | 🟡 MEDIUM | Recalculate weight for current distribution |

### Key Findings

**Issue 1: Leaderboard Referral Counts** (🔴 CRITICAL)
- Referral count increments on INSERT but never decrements on DELETE
- Result: Leaderboard becomes permanently inflated over time
- **Fix Required**: Add DELETE trigger to decrement count

**Issue 2: Tag Registration Verifications** (✅ No Action)
- Function already filters `WHERE user_id IS NOT NULL`
- Deleted users' tags won't create new verifications
- Historical verifications preserved correctly

**Issue 3: Tag Referral Verifications** (🟡 MEDIUM)
- Individual referral verifications become orphaned in current distribution
- Weight remains 1 even after referred user is deleted
- **Fix Required**: Set weight=0 for current distribution only

**Issue 4: Total Referrals Verifications** (🟡 MEDIUM)
- Aggregate referral count becomes incorrect
- Weight shows old count after referred user deletion
- **Fix Required**: Recalculate weight for current distribution only

### Key Principles

1. **Historical data preserved**: Closed distributions remain unchanged
2. **Current distribution affected**: Only the active distribution needs adjustment
3. **Future distributions protected**: New distributions won't have referral records for deleted users
4. **Leaderboard reflects current state**: Should show current referrals, not historical

### Detailed Analysis

For complete analysis including:
- Detailed problem scenarios
- SQL implementation examples
- Comprehensive testing requirements
- Data validation queries
- Deployment procedures

**See**: [Account Deletion: Referrals & Distribution Verifications Impact](./account-deletion-referrals-impact.md)

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

### Phase 0: Referrals & Distribution Verifications Fixes

Before implementing the main account deletion feature, we must fix the referral system to handle account deletions correctly. This is a **critical prerequisite** and must be deployed before enabling account deletion.

#### Overview

Three main tasks:
1. Add leaderboard decrement trigger (🔴 CRITICAL)
2. Handle distribution verifications on user deletion (🟡 MEDIUM)
3. Create comprehensive pgTAP tests

#### Implementation Components

**1. Leaderboard Decrement Trigger**
- Function: `private.decrement_leaderboard_referrals_on_delete()`
- Trigger: AFTER DELETE on `public.referrals`
- Purpose: Decrement referral count when a referral is deleted

**2. Distribution Verification Cleanup Trigger**
- Function: `public.cleanup_referral_verifications_on_user_delete()`
- Trigger: BEFORE DELETE on `public.profiles`
- Purpose: Set weight=0 for tag_referral and recalculate total_tag_referrals in current distribution only

**3. Comprehensive Tests**
- File: `supabase/tests/account_deletion_referrals_test.sql`
- Test categories: Leaderboard, Tag referrals, Total referrals, Edge cases
- Must pass before deployment

#### Detailed Implementation

For complete SQL implementations, testing requirements, and deployment procedures:

**See**: [Account Deletion: Referrals & Distribution Verifications Impact](./account-deletion-referrals-impact.md) - Implementation Plan section

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
   - Already created in Phase 0.3 (see above)
   - Run these tests first to validate Phase 0 fixes

3. **tRPC Endpoint Tests** (`packages/api/`)
   - Authenticated user can delete account
   - Unauthenticated request fails
   - Session is invalidated after deletion
   - Error handling works correctly

4. **Integration Tests**
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
- ✅ User can initiate account deletion from mobile app
- ✅ All personal data is removed from database
- ✅ Blockchain data remains accessible on-chain
- ✅ Apple App Store approval obtained
- ✅ Tests verify complete deletion
- ✅ No orphaned data remains in database

### Referrals System Integrity
- ✅ Leaderboard referral counts accurately reflect current referrals
- ✅ Leaderboard decrements when referred user deletes account
- ✅ Tag referral verifications in current distribution set to weight=0 when referred user deletes
- ✅ Total referrals verifications in current distribution recalculated correctly
- ✅ Closed (historical) distributions remain unchanged
- ✅ No errors when deleting user with no active distribution

### Testing & Validation
- ✅ All pgTAP tests pass for referrals system
- ✅ All pgTAP tests pass for account deletion
- ✅ Data validation queries show no inconsistencies
- ✅ Staging environment testing completed successfully
- ✅ Performance impact assessed and acceptable

## References

### External Documentation
- [Apple: Offering Account Deletion in Your App](https://developer.apple.com/support/offering-account-deletion-in-your-app)
- [Supabase Auth: Delete User](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)
- [GDPR Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)

### Related Documentation
- [Account Deletion: Referrals & Distribution Verifications Impact](./account-deletion-referrals-impact.md) - Detailed analysis and implementation plan for referrals system fixes

---

*Document created: 2025-11-25*
*Last updated: 2025-11-26*
