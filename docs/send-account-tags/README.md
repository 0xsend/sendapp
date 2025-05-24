# Send Account Tags Feature Overview

## Architecture Change

This feature introduces multiple sendtags per send account with a "main" tag concept. Users can now:
- Own multiple sendtags under one send account
- Select a primary "main" tag displayed throughout the app
- Switch their main tag without losing other tags

## Implementation Phases

This feature is organized into discrete phases. Each phase document contains all necessary information to complete that phase independently.

### Phase 1: [Database Schema & Migrations](./phase-1-database-schema.md)
- Create `send_account_tags` junction table
- Add `main_tag_id` to send_accounts
- Migrate existing tags to use numeric IDs
- Set up validation triggers

### Phase 2: [API Layer Updates](./phase-2-api-layer.md)
- Fix `registerFirstSendtag` to use send_account_id (CRITICAL)
- Add validation to `updateMainTag` endpoint
- Update tag creation and deletion endpoints
- Implement proper error handling

### Phase 3: [Frontend Components](./phase-3-frontend-components.md)
- Update sendtag management screen
- Implement main tag selection and deletion
- Add visual indicators for main tags
- Update profile and activity displays

### Phase 4: [Testing & Polish](./phase-4-testing.md)
- Run comprehensive test suite
- Add missing database indexes
- Fix migration issues
- Validate end-to-end functionality

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
1. Start with Phase 2 (API fixes) - addresses critical onboarding issue
2. Then Phase 1 (database indexes) for performance
3. Phase 3 (frontend polish) for UX improvements
4. Phase 4 (testing) to validate everything works

## Testing Commands

```bash
# Database tests
cd supabase && yarn supabase test

# API tests  
cd packages/api && yarn test | cat

# E2E tests
cd packages/playwright && yarn playwright test
```