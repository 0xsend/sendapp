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

The database layer has been fully implemented with the following key changes:

### Database Schema Updates (Completed)
- **Tags table**: Now uses numeric `id` as primary key, added 'available' status
- **New junction table**: `send_account_tags` links send accounts to tags
- **Send accounts**: Added `main_tag_id` for primary tag tracking
- **Related tables**: Updated `tag_receipts` and `referrals` to use `tag_id`
- **Historical tracking**: Added `historical_tag_associations` for audit trail
- **All declarative schemas**: Updated to reflect the new architecture

### Key Functions Implemented
- `create_tag()`: Properly creates tags linked to send accounts
- `confirm_tags()`: Updated signature to include `send_account_id`
- Tag lifecycle management through triggers
- RLS policies updated for new ownership model

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
- Created `send_account_tags` junction table
- Added `main_tag_id` to send_accounts
- Migrated existing tags to use numeric IDs
- Set up validation triggers
- Converted all migrations to declarative schemas

### Phase 2: [API Layer Updates](./phase-2-api-layer.md) 🚧 IN PROGRESS
- Fix `registerFirstSendtag` to use send_account_id (CRITICAL)
- Add validation to `updateMainTag` endpoint
- Update tag creation and deletion endpoints
- Implement proper error handling

### Phase 3: [Frontend Components](./phase-3-frontend-components.md) 📋 TODO
- Update sendtag management screen
- Implement main tag selection and deletion
- Add visual indicators for main tags
- Update profile and activity displays

### Phase 4: [Testing & Polish](./phase-4-testing.md) 📋 TODO
- Run comprehensive test suite
- Validate end-to-end functionality
- Performance optimization
- User acceptance testing

## Critical Issues to Address

### 🚨 Priority 1: registerFirstSendtag Fix
**Issue**: [#1518](https://github.com/0xsend/sendapp/issues/1518) - New user onboarding broken
- `registerFirstSendtag` bypasses `send_account_tags` table
- First sendtags not properly linked to send accounts
- Affects all new user sign-ups

### ⚠️ Priority 2: API Validation Missing  
**Issue**: [#1519](https://github.com/0xsend/sendapp/issues/1519) - Security vulnerability
- `updateMainTag` lacks validation
- Users can set invalid main_tag_id values
- No ownership or confirmation checks

## Quick Start

To continue development:
1. Generate TypeScript types: `cd supabase && yarn generate`
2. Review [Main Sendtag Implementation Approach](./main-sendtag-approach.md) for detailed design
3. Start with Phase 2 (API fixes) - addresses critical onboarding issue
4. Phase 3 (frontend polish) for UX improvements
5. Phase 4 (testing) to validate everything works

## Current State Summary

### ✅ Already Implemented in Database
- `main_tag_id` column on send_accounts table
- Foreign key constraint with ON DELETE SET NULL
- Performance index `idx_send_accounts_main_tag_id`
- `validate_main_tag_update()` trigger for data integrity
- `handle_tag_confirmation()` auto-assigns first tag as main
- `handle_send_account_tags_deleted()` auto-promotes next tag
- All declarative schemas updated and complete

### 🚧 Still Needed
- API endpoint to manually update main tag
- Frontend UI for selecting main tag
- Fix registerFirstSendtag to properly use send_account_tags

## Testing Commands

```bash
# Database tests
cd supabase && yarn supabase test

# Reset database after schema changes
cd supabase && yarn supabase reset

# Generate TypeScript types
cd supabase && yarn generate

# API tests  
cd packages/api && yarn test | cat

# E2E tests
cd packages/playwright && yarn playwright test
```

## Working with Declarative Schemas

All database changes are now managed through declarative schemas in `/supabase/schemas/`. When making changes:

1. Stop the database: `cd supabase && yarn supabase stop`
2. Edit schema files in `/supabase/schemas/`
3. Generate migration: `cd supabase && yarn migration:diff <migration_name>`
4. Start database: `cd supabase && yarn supabase start`

The CI pipeline includes schema drift detection to ensure migrations stay in sync with declarative schemas.