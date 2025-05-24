# Send Account Tags Feature Summary

## Overview

This branch introduces a significant architectural change to how sendtags are managed in the application. The key enhancement is the ability for users to have multiple sendtags associated with their send account and select a "main" sendtag that is displayed throughout the app.

## Key Changes

### 1. Database Schema Updates

#### New Tables and Columns

- **`send_account_tags` table**: A junction table that links send accounts to their tags
  - `id`: Primary key
  - `send_account_id`: Foreign key to send_accounts
  - `tag_id`: Foreign key to tags
  - `created_at` and `updated_at` timestamps
  - See: `supabase/migrations/20250118103225_sendtag_updates.sql:2-8`

- **`send_accounts.main_tag_id`**: New column to store the user's selected main tag
  - See: `supabase/migrations/20250118103225_sendtag_updates.sql:10-11`

- **`tags` table modifications**:
  - Added `id` column as the new primary key (previously `name` was the primary key)
  - Made `user_id` nullable (tags can exist without an owner)
  - Added `updated_at` column with automatic timestamp trigger
  - Maintained `name` as a unique constraint
  - See: `supabase/migrations/20250118103223_add_tag_id.sql:8-118`

#### Migration Strategy

1. **Tag ID Migration** (`supabase/migrations/20250118103223_add_tag_id.sql`):
   - Adds numeric IDs to existing tags while preserving relationships
   - Updates foreign keys in `tag_receipts` and `referrals` tables
   - Transitions from name-based to ID-based references
   - See lines: 8-94 for core migration logic

2. **Send Account Tags** (`supabase/migrations/20250118103225_sendtag_updates.sql`):
   - Creates the `send_account_tags` junction table (lines 2-8)
   - Populates it with existing user-tag relationships (lines 19-35)
   - Sets initial main tags based on the oldest confirmed tag (lines 37-52)
   - Adds validation triggers to ensure main_tag_id is always a confirmed tag owned by the user (lines 73-110)

3. **Historical Data** (`supabase/migrations/20250118103226_tag_historical_data.sql`):
   - Preserves tag history and audit trail capabilities

### 2. API Changes

#### New Endpoints

- **`tag.create`**: Creates a new pending tag for a send account
  - See: `packages/api/src/routers/tag/router.ts:23-64`
  - Uses `create_tag` RPC function with send_account_id

- **`tag.delete`**: Removes a tag from a user's send account (sets status to 'available')
  - See: `packages/api/src/routers/tag/router.ts:341-410`
  - Deletes from `send_account_tags` and updates tag status

- **`sendAccount.updateMainTag`**: Updates the user's main tag selection
  - See: `packages/api/src/routers/sendAccount.ts:453-479`
  - Updates `main_tag_id` in send_accounts table

#### Modified Endpoints

- **`tag.confirm`**: Updated to work with send_account_id instead of user_id
  - See: `packages/api/src/routers/tag/router.ts:302-325`
  - Now fetches send account and passes send_account_id to confirm_tags RPC
- Tag confirmation now properly associates tags with send accounts

### 3. Frontend Updates

#### UI Components

- **Account Sendtag Screen**: 
  - Displays all user's tags with the main tag shown first
  - Allows users to manage their tags (add, delete, set as main)
  - See: `packages/app/features/account/sendtag/screen.tsx:63-68` (sorting logic)
  - See: `packages/app/features/account/sendtag/screen.skiptest.tsx:107-113` (main tag pill)
  
- **Profile Display**:
  - Shows the main tag preferentially throughout the app
  - Falls back to other tags if no main tag is set
  - See: `packages/app/features/profile/components/ProfileHeader.tsx:61-62` (main tag display)
  - See: `packages/app/features/profile/components/ProfileAboutTile.tsx` (updated display logic)
  
- **Activity Feed**:
  - Updated to display main tags in user references
  - Consistent tag display across all activity types
  - See: `packages/app/features/activity/RecentActivity.tsx` (main tag integration)
  - See: `packages/app/features/home/TokenActivityRow.tsx` (activity row updates)

#### User Schema Updates

- Added `main_tag_id` and `main_tag_name` fields to user data structures
  - See: `packages/app/utils/zod/activity/UserSchema.ts:10-11` (schema additions)
  - See: `packages/app/utils/zod/activity/UserSchema.test.ts` (test updates)
- Updated TypeScript types and Zod schemas to include these new fields
  - See: `supabase/database.types.ts` and `supabase/database-generated.types.ts`

### 4. Testing Updates

- Comprehensive test suite updates for:
  - Send account tag relationships
  - Main tag validation
  - Tag deletion and status changes
  - Profile lookup with main tags
  - Activity feed with main tag display

- New test files:
  - `supabase/tests/send_account_tags_test.sql`: Tests for the junction table and relationships
  - Updated existing tests to work with the new ID-based tag system:
    - `supabase/tests/tags_confirmation_test.sql` (updated for new confirm_tags parameters)
    - `supabase/tests/profile_lookup_test.sql` (includes main_tag_name tests)
    - `supabase/tests/activity_feed_test.sql` (main tag display in activity)
    - `supabase/tests/tag_referrals_test.sql` (updated for tag_id references)

- Playwright E2E tests:
  - `packages/playwright/tests/account-sendtag-add.onboarded.spec.ts` (add tag flow)
  - `packages/playwright/tests/account-sendtag-checkout.onboarded.spec.ts` (checkout updates)
  - `packages/playwright/tests/profile.*.spec.ts` (profile display tests)

### 5. Key Benefits

1. **Multiple Tags**: Users can own multiple sendtags under one send account
2. **Tag Flexibility**: Users can switch their main tag without losing other tags
3. **Better UX**: Consistent display of the user's preferred tag across the app
4. **Future Extensibility**: Architecture supports future features like tag trading or transfers

### 6. Breaking Changes

- Tags now use numeric IDs instead of names as primary keys
- Tag references throughout the codebase updated from name-based to ID-based
- Some API endpoints have different parameter requirements

### 7. Migration Considerations

- Existing tags are automatically migrated with sequential IDs
  - See: `supabase/migrations/20250118103223_add_tag_id.sql:23-36` (ID assignment logic)
- User's first confirmed tag becomes their main tag by default
  - See: `supabase/migrations/20250118103225_sendtag_updates.sql:37-52` (main tag assignment)
- All existing tag relationships are preserved
  - See: `supabase/migrations/20250118103223_add_tag_id.sql:58-90` (relationship updates)
- No data loss during migration

## Summary

This feature represents a fundamental improvement in how sendtags are managed, moving from a one-to-one user-tag relationship to a more flexible many-to-many model with the concept of a "main" tag. This provides users with greater flexibility in managing their digital identity while maintaining backward compatibility with existing functionality.

## Post-Rebase Review Status

### Branch Information
- Current branch: `send_account_tags_rebased` 
- Original branch (pre-rebase): `send_account_tags`
- Base branch: `dev`

### Issues Found During Review

#### 1. ✅ Fixed - Frontend Bug in screen.tsx
- **Issue**: Undefined variables `allTags` and `mainTagId` in sorting logic
- **Location**: `packages/app/features/account/sendtag/screen.tsx:64-68`
- **Fix Applied**: Moved sorting logic to proper location, added `useSendAccount` hook, and passed `mainTagId` to child components

#### 2. Critical - API Validation Missing
- **Issue**: `updateMainTag` procedure lacks validation
- **Location**: `packages/api/src/routers/sendAccount.ts` (updateMainTag procedure)
- **Details**: No checks to ensure:
  - Tag exists
  - Tag belongs to user's send account
  - Tag is confirmed (not pending)
- **Risk**: Users could set main_tag_id to invalid values

#### 3. High Priority - Inconsistent send_account_id Usage
- **Issue**: `registerFirstSendtag` still uses `user_id` instead of `send_account_id`
- **Location**: `packages/api/src/routers/tag/router.ts:132`
- **Details**: Bypasses the new `create_tag` RPC and directly inserts with `user_id`

#### 4. Database Migration Issues
- **Missing Column Drop**: Migration references dropping `referrals.tag` column that was never dropped
- **Location**: `supabase/migrations/20250118103228_update_tag_functions.sql:593`
- **Function Compatibility**: `check_tags_allowlist_before_insert_func` still assumes direct user_id relationship

#### 5. Performance - Missing Indexes
- **Tables needing indexes**:
  - `referrals.tag_id`
  - `send_accounts.main_tag_id`
  - `send_account_tags` foreign keys

### Remaining TODOs

1. **Fix API validation in updateMainTag** - ensure tag belongs to user (HIGH)
2. **Fix registerFirstSendtag to use send_account_id** (HIGH)
3. **Add missing database indexes for performance** (MEDIUM)
4. **Fix missing column drop in referrals table migration** (MEDIUM)
5. **Run Supabase tests to verify database changes** (MEDIUM)
6. **Run Playwright tests to verify UI functionality** (MEDIUM)

### Next Steps

When continuing work:
1. Start by fixing the critical API validation issue in `updateMainTag`
2. Update `registerFirstSendtag` to properly use the new tag model
3. Create a migration to add the missing indexes and fix the referrals table
4. Run comprehensive tests to ensure everything works after the rebase

### Testing Commands

```bash
# Run Supabase tests
cd supabase && yarn supabase test

# Run Playwright tests
cd packages/playwright && yarn playwright test

# Run API tests
cd packages/api && yarn test | cat
```