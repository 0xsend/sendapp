# Phase 1: Database Schema & Migrations

**GitHub Issue**: [#1520 - Fix database migration issues](https://github.com/0xsend/sendapp/issues/1520) & [#1521 - Add missing database indexes](https://github.com/0xsend/sendapp/issues/1521)

## Objective

Implement the database foundation for multiple sendtags per send account with a main tag concept.

## Summary of Changes

This phase introduced a major architectural change to support multiple tags per send account:

1. **Tags now use numeric IDs** instead of name as primary key
2. **New junction table** `send_account_tags` links send accounts to tags
3. **Main tag concept** via `send_accounts.main_tag_id`
4. **Tag lifecycle** includes 'available' status for unclaimed tags
5. **Updated relationships** across all tag-related tables

## Main Sendtag Implementation Details

The main sendtag feature was designed with minimal disruption to existing functionality:

### Core Implementation
1. **Single column addition**: `main_tag_id bigint` on `send_accounts`
2. **Automatic behavior**: First confirmed tag becomes main automatically
3. **Smart deletion handling**: Next oldest tag becomes main when current main is deleted
4. **Strict validation**: Cannot set invalid or unowned tags as main

### Key Benefits
- **No breaking changes**: Existing tag operations continue unchanged
- **Backward compatible**: Old code works without modification
- **Performant**: Indexed foreign key for fast lookups
- **Data integrity**: Database-level constraints prevent invalid states

## Schema Changes

### 1. Tags Table Evolution

**Before:**
```sql
-- Primary key was name
CREATE TABLE tags (
    name citext PRIMARY KEY,
    status tag_status DEFAULT 'pending',
    user_id uuid NOT NULL REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
);
```

**After:**
```sql
-- Numeric ID as primary key, name is unique
CREATE TABLE tags (
    id bigint PRIMARY KEY DEFAULT nextval('tags_id_seq'),
    name citext NOT NULL UNIQUE,
    status tag_status DEFAULT 'pending', -- includes 'available'
    user_id uuid REFERENCES auth.users(id), -- nullable
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
```

### 2. New Junction Table: `send_account_tags`

Links send accounts to their tags (many-to-many relationship):

```sql
CREATE TABLE send_account_tags (
    id serial PRIMARY KEY,
    send_account_id uuid NOT NULL REFERENCES send_accounts(id) ON DELETE CASCADE,
    tag_id bigint NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT NOW(),
    updated_at timestamp with time zone NOT NULL DEFAULT NOW(),
    UNIQUE(send_account_id, tag_id)
);

-- Critical indexes for performance
CREATE INDEX idx_send_account_tags_tag_id ON send_account_tags(tag_id);
CREATE INDEX idx_send_account_tags_send_account_id ON send_account_tags(send_account_id);
```

### 3. Send Accounts Enhancement

Added main tag tracking:

```sql
ALTER TABLE send_accounts 
ADD COLUMN main_tag_id bigint REFERENCES tags(id) ON DELETE SET NULL;

-- Index for foreign key performance
CREATE INDEX idx_send_accounts_main_tag_id ON send_accounts(main_tag_id);
```

### 4. Related Table Updates

**tag_receipts:**
```sql
-- Added tag_id column
ALTER TABLE tag_receipts ADD COLUMN tag_id bigint NOT NULL;
-- Updated foreign key from name to ID
ALTER TABLE tag_receipts DROP CONSTRAINT tag_receipts_tag_name_fkey;
ALTER TABLE tag_receipts ADD CONSTRAINT tag_receipts_tag_id_fkey 
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;
```

**referrals:**
```sql
-- Added tag_id column
ALTER TABLE referrals ADD COLUMN tag_id bigint NOT NULL;
-- Added foreign key constraint
ALTER TABLE referrals ADD CONSTRAINT referrals_tag_id_fkey 
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE;
```

### 5. Historical Tracking

New table for audit trail:

```sql
CREATE TABLE historical_tag_associations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name citext NOT NULL,
    tag_id bigint NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    status tag_status NOT NULL,
    captured_at timestamp with time zone DEFAULT NOW()
);
```

## Key Functions Rewritten

### 1. `create_tag` Function (NEW)

Properly creates tags linked to send accounts:

```sql
CREATE OR REPLACE FUNCTION public.create_tag(tag_name citext, send_account_id uuid)
RETURNS bigint AS $$
-- Key features:
-- - Verifies user owns the send_account
-- - Enforces 5 tag limit per user
-- - Reuses available tags when possible
-- - Creates send_account_tags entry
-- - Returns the new/reused tag_id
$$;
```

### 2. `confirm_tags` Function (UPDATED)

New signature includes send_account_id:

```sql
-- Old: confirm_tags(tag_names[], event_id, referral_code)
-- New: confirm_tags(tag_names[], send_account_id, event_id, referral_code)

-- Now properly:
-- - Links tags to send_account via send_account_tags
-- - Verifies ownership through send_account
-- - Handles referrals with tag_id
```

### 3. Tag Lifecycle Functions

**`handle_send_account_tags_deleted`**: When removing a tag from an account
- Sets tag to 'available' if no other accounts use it
- **Main tag handling**: If deleted tag was main, automatically promotes next oldest confirmed tag
- Uses `ORDER BY created_at ASC` to maintain predictable succession

**`handle_tag_confirmation`**: When confirming a tag
- **Auto-sets as main_tag_id if user has none**
- Ensures users always have a main tag when they have confirmed tags
- Fires on `tags` table when status changes to 'confirmed'

**`validate_main_tag_update`**: Before updating main_tag_id
- **Prevents setting to NULL** when confirmed tags exist
- **Validates ownership** - main_tag_id must be user's confirmed tag
- Ensures data integrity at database level

## Updated RLS Policies

### Tags Table
```sql
-- SELECT: See available tags OR your own tags through send_account
CREATE POLICY "select_policy" ON tags FOR SELECT
USING (
    status = 'available' OR
    EXISTS (
        SELECT 1 FROM send_account_tags sat
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sat.tag_id = tags.id AND sa.user_id = auth.uid()
    )
);

-- UPDATE/DELETE: Only your tags through send_account
-- INSERT: Only pending status allowed
```

### send_account_tags Table
```sql
-- All operations require send_account ownership
CREATE POLICY "select_policy" ON send_account_tags FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM send_accounts sa
        WHERE sa.id = send_account_id AND sa.user_id = auth.uid()
    )
);
```

## Migration Files Overview

### Core Migrations (in order)

1. **`20250524000001_add_tag_id.sql`**
   - Adds ID column to tags
   - Migrates foreign keys in tag_receipts and referrals
   - Establishes numeric primary key

2. **`20250524000002_update_tag_status_enum.sql`**
   - Adds 'available' status for unclaimed tags

3. **`20250524000003_sendtag_updates.sql`**
   - Creates send_account_tags junction table
   - Adds main_tag_id to send_accounts
   - Populates initial relationships
   - Sets up validation triggers

4. **`20250524000004_tag_historical_data.sql`**
   - Creates historical tracking table
   - Backs up existing associations
   - Releases unused tags to 'available' status

5. **`20250524000005_update_tag_functions.sql`**
   - Updates all functions for new schema
   - Rewrites RLS policies
   - Adds new helper functions

## Declarative Schema Files

All changes have been captured in declarative schema files:

1. **`/supabase/schemas/tags.sql`** - Complete rewrite for ID-based system
2. **`/supabase/schemas/send_account_tags.sql`** - NEW junction table schema
3. **`/supabase/schemas/send_accounts.sql`** - Added main_tag_id support
4. **`/supabase/schemas/tag_receipts.sql`** - Updated for tag_id
5. **`/supabase/schemas/referrals.sql`** - Added tag_id column
6. **`/supabase/schemas/historical_tag_associations.sql`** - NEW audit table

## Testing Checklist

- [x] Tags table uses numeric IDs
- [x] send_account_tags junction table created
- [x] All foreign keys updated to use tag_id
- [x] main_tag_id validation works
- [x] Tag lifecycle (pending -> confirmed -> available) functions
- [x] RLS policies enforce proper access control
- [x] Historical data preserved
- [x] Performance indexes in place

## Known Issues Resolved

1. ✅ **Missing indexes** - All foreign key indexes added
2. ✅ **Function compatibility** - All functions updated for new schema
3. ✅ **Migration sequencing** - Proper order established
4. ✅ **Tag ownership model** - Now properly through send_accounts

## Data Migration Process

The migrations handle:
1. Assigning sequential IDs to existing tags
2. Creating send_account_tags entries for existing relationships  
3. Setting initial main_tag_id values (oldest confirmed tag)
4. Releasing orphaned tags to 'available' status
5. Preserving history in historical_tag_associations

## Testing

```bash
# Run all database tests
cd supabase && yarn supabase test

# Key test files updated:
# - send_account_tags_test.sql
# - tags_confirmation_test.sql  
# - tag_referrals_test.sql
# - tags_update_test.sql
```

## Next Steps

With the database schema complete:
1. Generate TypeScript types: `cd supabase && yarn generate`
2. Proceed to **Phase 2: API Layer Updates** to fix the critical `registerFirstSendtag` issue
3. Update frontend components in Phase 3 to use the new schema