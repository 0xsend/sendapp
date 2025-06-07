# Send Account Tags Feature Overview

## Architecture Change

This feature introduces multiple sendtags per send account with a "main" tag concept. Users can now:
- Own multiple sendtags under one send account (up to 5 tags)
- Select a primary "main" tag displayed throughout the app
- Switch their main tag without losing other tags
- Tags use numeric IDs instead of name as primary key
- Unclaimed tags have 'available' status for reuse

## Main Sendtag Approach

The main sendtag functionality is implemented with minimal database changes:

### Database Design
1. **main_tag_id column** on `send_accounts` table
   - Foreign key to `tags(id)` with `ON DELETE SET NULL`
   - Indexed for performance (`idx_send_accounts_main_tag_id`)

2. **Automatic main tag assignment**
   - First confirmed tag becomes main automatically via `handle_tag_confirmation()` trigger
   - When deleting current main tag, next oldest confirmed tag becomes main via `handle_send_account_tags_deleted()` trigger

3. **Validation via triggers**
   - `validate_main_tag_update()` ensures:
     - Cannot set main_tag_id to NULL if confirmed tags exist
     - main_tag_id must be one of user's confirmed tags

4. **No API breaking changes**
   - Existing tag operations continue to work
   - Main tag selection is additive functionality

## Current Implementation Status

After intensive database testing and fixes, the implementation status is:

### ✅ Database Schema (Phase 1 - COMPLETED)
- **Tags table**: Uses numeric `id` as primary key, includes 'available' status for tag reuse
- **Junction table**: `send_account_tags` fully implemented with proper foreign keys and indexes
- **Send accounts**: `main_tag_id` field with foreign key constraint and validation triggers
- **Historical tracking**: `historical_tag_associations` table for audit trail
- **All schemas**: Converted to declarative schema format in `/supabase/schemas/`

### ✅ Key Database Functions (COMPLETED)
- `create_tag()`: Creates tags properly linked to send accounts via junction table
- `confirm_tags()`: Updated to use `send_account_id` parameter and create junction table entries
- `validate_main_tag_update()`: Prevents invalid main tag assignments
- `handle_tag_confirmation()`: Auto-assigns first confirmed tag as main
- `handle_send_account_tags_deleted()`: Manages tag deletion and main tag promotion
- **RLS policies**: Updated for new ownership model via junction table
- **Database tests**: ✅ 100% passing - All functionality tested and validated

### ✅ API Layer (Phase 2 - COMPLETED IN THIS BRANCH)
- ✅ `tag.create`: Uses proper `create_tag` function with `send_account_id`
- ✅ `tag.confirm`: Uses proper `confirm_tags` function with `send_account_id` 
- ✅ `tag.delete`: Correctly deletes from `send_account_tags` junction table
- ✅ `sendAccount.updateMainTag`: Fully implemented main tag selection endpoint
- ✅ `tag.registerFirstSendtag`: **FIXED** - Now properly uses `register_first_sendtag` database function with `send_account_id`

## API Approach for Main Tags

The API layer should expose simple operations for main tag management:

### 1. Get User's Tags with Main Indicator
```typescript
// Returns all user's tags with isMain flag
GET /api/tags
Response: [
  { id: 1, name: "alice", status: "confirmed", isMain: true },
  { id: 2, name: "alice_work", status: "confirmed", isMain: false }
]
```

### 2. Update Main Tag
```typescript
// Set a different tag as main
PUT /api/account/main-tag
Body: { tagId: 2 }
// Database trigger validates ownership
```

### 3. Automatic Main Tag Assignment
- No API changes needed for tag creation/confirmation
- Database triggers handle main tag assignment automatically
- When deleting tags, no special handling required

### Frontend Display Logic
```typescript
// Profile displays main tag
const mainTag = user.tags.find(t => t.isMain) || user.tags[0];

// Tag management shows radio buttons
tags.map(tag => (
  <RadioButton
    checked={tag.isMain}
    onChange={() => updateMainTag(tag.id)}
  />
))
```

## Implementation Phases

### Phase 1: [Database Schema & Migrations](./phase-1-database-schema.md) ✅ COMPLETED
- ✅ Created `send_account_tags` junction table with proper foreign keys and indexes
- ✅ Added `main_tag_id` to send_accounts with validation triggers  
- ✅ Migrated existing tags to use numeric IDs as primary key
- ✅ Set up tag lifecycle management triggers (`handle_tag_confirmation`, `handle_send_account_tags_deleted`)
- ✅ Converted all migrations to declarative schemas in `/supabase/schemas/`
- ✅ Updated RLS policies for new ownership model
- ✅ Added 'available' status for tag reuse functionality
- ✅ **Database tests**: ✅ All tests fixed and passing (100% pass rate)

### Phase 2: [API Layer Updates](./phase-2-api-layer.md) ✅ COMPLETED IN THIS BRANCH
- ✅ Updated `tag.create` to use proper `create_tag` function with `send_account_id`
- ✅ Updated `tag.confirm` to use proper `confirm_tags` function with `send_account_id`
- ✅ Updated `tag.delete` to work with `send_account_tags` junction table
- ✅ Implemented `sendAccount.updateMainTag` endpoint with validation
- ✅ **FIXED**: `registerFirstSendtag` now properly uses database function with `send_account_id`
- ✅ Added database function `register_first_sendtag` that handles junction table creation

### Phase 3: [Frontend Components](./phase-3-frontend-components.md) 🚧 IN PROGRESS
- ✅ Updated sendtag management screen to show multiple tags (COMPLETED IN THIS BRANCH)
- ✅ Implemented main tag selection UI with sheet component (COMPLETED IN THIS BRANCH)
- ✅ Added visual indicators for main tags in tag list (COMPLETED IN THIS BRANCH)
- 📋 Update activity feed to use main tags (TODO)
- 📋 Update profile displays with main tag indicators (TODO)
- 📋 Handle tag deletion UI and confirmations (TODO)

### Phase 4: [Testing & Polish](./phase-4-testing.md) 🚧 IN PROGRESS
- ✅ Fixed critical `registerFirstSendtag` onboarding issue (COMPLETED IN THIS BRANCH)
- ✅ Added E2E test for happy path: create tags, confirm, change main tag (COMPLETED IN THIS BRANCH)
- 📋 Run comprehensive test suite (database, API, E2E) (TODO)
- 📋 Performance testing with multiple tags per user (TODO)
- 📋 User acceptance testing for main tag functionality (TODO)

## ✅ Critical Issues Resolved in This Branch

### ✅ Priority 1: registerFirstSendtag Onboarding Issue (FIXED)
**Location**: `packages/api/src/routers/tag/router.ts:96-164`
**Solution Implemented**: The `registerFirstSendtag` endpoint now properly uses the `register_first_sendtag` database function:

```typescript
// FIXED - properly uses database function with send_account_id
const { data: result, error } = await supabase.rpc('register_first_sendtag', {
  tag_name: name,
  send_account_id: sendAccountId,
  _referral_code: referralCode,
})
```

**Impact**: 
- ✅ **NEW USER ONBOARDING NOW WORKS CORRECTLY**
- ✅ First sendtags are properly linked to send accounts via junction table
- ✅ Users can access their first sendtag through proper queries
- ✅ Database integrity is maintained
- ✅ Feature is no longer blocked by this issue

**Implementation Details**:
1. API endpoint now requires `sendAccountId` parameter
2. Uses `register_first_sendtag` database function
3. Function creates both tag and `send_account_tags` association atomically
4. Automatically sets as main tag if no main tag exists
5. E2E test verifies the complete flow

### ✅ Priority 2: API Validation (RESOLVED)
- `updateMainTag` endpoint is properly implemented with database-level validation
- Database triggers prevent invalid main_tag_id assignments
- Proper ownership checks via RLS policies
- Frontend integration completed with proper error handling and toast notifications

## Quick Start

### ✅ Critical Fix Completed in This Branch
1. **registerFirstSendtag onboarding issue has been fixed**:
   - Location: `packages/api/src/routers/tag/router.ts:96-164`
   - Now uses proper `register_first_sendtag` database function
   - E2E test confirms `send_account_tags` associations are created correctly

### For Development Continuation:
1. **Generate TypeScript types**: `cd supabase && yarn generate` 
2. **Review completed implementation**:
   - Database schemas in `/supabase/schemas/`
   - API fixes in `packages/api/src/routers/tag/router.ts`
   - Frontend components in `packages/app/features/account/sendtag/screen.tsx`
   - E2E test in `packages/playwright/tests/sendtag-happy-path.onboarded.spec.ts`
3. **Phase 3 completion (Frontend)**: 
   - ✅ Main tag selection UI (DONE)
   - 📋 Profile displays and activity feed updates (TODO)
4. **Phase 4 (Testing)**: Additional E2E tests and performance validation

### Architecture Reference
- [Main Sendtag Implementation Approach](./main-sendtag-approach.md) - Detailed design decisions
- [Phase 1 Database Schema](./phase-1-database-schema.md) - ✅ Completed implementation details

## Current State Summary

### ✅ Database Layer (FULLY IMPLEMENTED)
- ✅ `send_account_tags` junction table with proper foreign keys and indexes
- ✅ `main_tag_id` column on send_accounts with foreign key constraint (ON DELETE SET NULL)
- ✅ Performance indexes for efficient queries
- ✅ `validate_main_tag_update()` trigger prevents invalid main tag assignments
- ✅ `handle_tag_confirmation()` auto-assigns first confirmed tag as main
- ✅ `handle_send_account_tags_deleted()` auto-promotes next oldest tag as main
- ✅ All schemas converted to declarative format in `/supabase/schemas/`
- ✅ RLS policies updated for new ownership model
- ✅ Tag reuse functionality with 'available' status
- ✅ **Database tests**: ✅ All tests passing (100% pass rate), complete functionality validated

### ✅ API Layer (COMPLETED IN THIS BRANCH)
- ✅ `sendAccount.updateMainTag` endpoint for manual main tag selection with frontend integration
- ✅ `tag.create`, `tag.confirm`, `tag.delete` all use proper junction table
- ✅ `tag.registerFirstSendtag` fixed to properly create junction table associations

### ✅ Completed in This Branch
1. **✅ CRITICAL**: Fixed `registerFirstSendtag` to use proper database function
2. **✅ Frontend**: Main tag selection UI implemented with sheet component
3. **✅ Frontend**: Visual indicators for main tags in tag list
4. **✅ Testing**: E2E happy path test for tag creation and main tag selection

### 📋 Remaining Tasks
1. **Frontend (1 day)**: Update profile displays and activity feeds to show main tags
2. **Frontend (0.5 day)**: Implement tag deletion UI with confirmations
3. **Testing (1 day)**: Additional E2E tests for edge cases and error scenarios
4. **Performance (0.5 day)**: Test with maximum tags per user

## Testing Commands

```bash
# Database tests (✅ All tests passing - complete functionality verified)
cd supabase && supabase test db

# API tests (test all endpoints including registerFirstSendtag fix)
cd packages/api && yarn test | cat

# E2E tests (test complete user flows)
cd packages/playwright && yarn playwright test

# Generate TypeScript types after schema changes
cd supabase && yarn generate

# Reset database after schema modifications (required for declarative schemas)
cd supabase && yarn supabase stop && yarn supabase start
```

## Database Test Results

**Current Status**: ✅ All tests passing (100% pass rate)

**✅ Validated Functionality**:
- All core functionality tests (tag creation, confirmation, deletion)
- Junction table operations and associations  
- Main tag assignment and succession
- RLS policies and security
- Database integrity and constraints
- Tag lifecycle management
- Trigger functions and validation
- Complete database schema integrity

## Working with Declarative Schemas

This project uses **declarative schemas** (not traditional migrations) in `/supabase/schemas/`. 

### Current Schema Files:
- `send_account_tags.sql` - Junction table implementation
- `send_accounts.sql` - Main tag functionality
- `tags.sql` - Tag creation and lifecycle
- `tags_rls_policies.sql` - Row-level security

### Making Database Changes:
1. **Stop database**: `cd supabase && yarn supabase stop`
2. **Edit schema files**: Modify files in `/supabase/schemas/`
3. **Generate migration**: `cd supabase && yarn migration:diff <migration_name>`
4. **Start database**: `cd supabase && yarn supabase start`

⚠️ **Important**: Always stop the database before editing schema files. The CI pipeline includes schema drift detection to ensure migrations stay synchronized with declarative schemas.
