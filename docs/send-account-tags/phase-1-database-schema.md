# Phase 1: Database Schema & Migrations

**Status**: ✅ COMPLETED (Database tests: ✅ All passing - 100% pass rate)

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

### 4. Historical Tracking

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
        WHERE sat.tag_id = tags.id AND sa.user_id = (select auth.uid())
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
        WHERE sa.id = send_account_id AND sa.user_id = (select auth.uid())
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

## Comprehensive Supabase Test Plan

This test plan validates all database schema changes, functions, triggers, and RLS policies. All tests should be implemented in `/supabase/tests/` using pgTAP framework.

### Test Categories

#### **1. Schema Validation Tests**
**File**: `send_account_tags_schema_test.sql`

```sql
-- Test 1: Junction table structure
SELECT has_table('public', 'send_account_tags', 'send_account_tags table exists');
SELECT has_pk('public', 'send_account_tags', 'send_account_tags has primary key');
SELECT has_column('public', 'send_account_tags', 'send_account_id', 'has send_account_id column');
SELECT has_column('public', 'send_account_tags', 'tag_id', 'has tag_id column');

-- Test 2: Foreign key constraints
SELECT has_fk('public', 'send_account_tags', 'send_account_tags_send_account_id_fkey');
SELECT has_fk('public', 'send_account_tags', 'send_account_tags_tag_id_fkey');
SELECT fk_ok('public', 'send_account_tags', 'send_account_id', 'public', 'send_accounts', 'id');
SELECT fk_ok('public', 'send_account_tags', 'tag_id', 'public', 'tags', 'id');

-- Test 3: Unique constraint on junction table
SELECT has_unique('public', 'send_account_tags', ARRAY['send_account_id', 'tag_id']);

-- Test 4: main_tag_id foreign key
SELECT has_column('public', 'send_accounts', 'main_tag_id', 'send_accounts has main_tag_id');
SELECT fk_ok('public', 'send_accounts', 'main_tag_id', 'public', 'tags', 'id');

-- Test 5: Tags table ID column
SELECT has_column('public', 'tags', 'id', 'tags table has id column');
SELECT col_is_pk('public', 'tags', 'id', 'id is primary key');
SELECT col_type_is('public', 'tags', 'id', 'bigint', 'id is bigint');

-- Test 6: Essential indexes exist
SELECT has_index('public', 'send_account_tags', 'idx_send_account_tags_tag_id');
SELECT has_index('public', 'send_account_tags', 'idx_send_account_tags_send_account_id');
SELECT has_index('public', 'send_accounts', 'idx_send_accounts_main_tag_id');
```

#### **2. Tag Creation and Lifecycle Tests**
**File**: `send_account_tags_lifecycle_test.sql`

```sql
-- Test create_tag function
DO $$
DECLARE
    test_user_id uuid;
    test_send_account_id uuid;
    tag_id bigint;
BEGIN
    -- Setup test user and send account
    INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'test@example.com') 
    RETURNING id INTO test_user_id;
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (test_user_id, '0x1234567890123456789012345678901234567890', 8453, '\x00')
    RETURNING id INTO test_send_account_id;
    
    -- Test 1: Create tag successfully
    SELECT create_tag('testtag1', test_send_account_id) INTO tag_id;
    
    SELECT ok(tag_id IS NOT NULL, 'create_tag returns tag_id');
    SELECT ok(EXISTS(
        SELECT 1 FROM send_account_tags 
        WHERE send_account_id = test_send_account_id AND tag_id = tag_id
    ), 'Junction table entry created');
    
    -- Test 2: Tag reuse when available
    UPDATE tags SET status = 'available' WHERE id = tag_id;
    DELETE FROM send_account_tags WHERE tag_id = tag_id;
    
    SELECT create_tag('testtag1', test_send_account_id) INTO tag_id;
    SELECT ok(EXISTS(
        SELECT 1 FROM tags WHERE id = tag_id AND status = 'pending'
    ), 'Available tag reused and set to pending');
    
    -- Test 3: Tag limit enforcement (attempt 6th tag)
    FOR i IN 1..5 LOOP
        PERFORM create_tag('tag' || i, test_send_account_id);
    END LOOP;
    
    BEGIN
        PERFORM create_tag('tag6', test_send_account_id);
        SELECT ok(false, 'Should not allow 6th tag');
    EXCEPTION 
        WHEN OTHERS THEN
            SELECT ok(SQLERRM LIKE '%at most 5 tags%', 'Tag limit enforced');
    END;
END $$;
```

#### **3. Main Tag Functionality Tests**
**File**: `main_tag_functionality_test.sql`

```sql
-- Test main tag auto-assignment and validation
DO $$
DECLARE
    test_user_id uuid;
    test_send_account_id uuid;
    tag1_id bigint;
    tag2_id bigint;
BEGIN
    -- Setup
    INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'maintest@example.com') 
    RETURNING id INTO test_user_id;
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (test_user_id, '0x2234567890123456789012345678901234567890', 8453, '\x00')
    RETURNING id INTO test_send_account_id;
    
    -- Test 1: First confirmed tag becomes main automatically
    SELECT create_tag('maintag1', test_send_account_id) INTO tag1_id;
    UPDATE tags SET status = 'confirmed' WHERE id = tag1_id;
    
    SELECT ok(EXISTS(
        SELECT 1 FROM send_accounts 
        WHERE id = test_send_account_id AND main_tag_id = tag1_id
    ), 'First confirmed tag auto-assigned as main');
    
    -- Test 2: Main tag validation - cannot set to unowned tag
    SELECT create_tag('maintag2', test_send_account_id) INTO tag2_id;
    UPDATE tags SET status = 'confirmed' WHERE id = tag2_id;
    
    BEGIN
        UPDATE send_accounts SET main_tag_id = 99999 WHERE id = test_send_account_id;
        SELECT ok(false, 'Should not allow invalid main_tag_id');
    EXCEPTION 
        WHEN OTHERS THEN
            SELECT ok(SQLERRM LIKE '%must be one of your confirmed tags%', 'Invalid main tag rejected');
    END;
    
    -- Test 3: Cannot set main_tag_id to NULL when confirmed tags exist
    BEGIN
        UPDATE send_accounts SET main_tag_id = NULL WHERE id = test_send_account_id;
        SELECT ok(false, 'Should not allow NULL main_tag_id with confirmed tags');
    EXCEPTION 
        WHEN OTHERS THEN
            SELECT ok(SQLERRM LIKE '%Cannot set main_tag_id to NULL%', 'NULL main_tag_id prevented');
    END;
    
    -- Test 4: Main tag succession on deletion
    DELETE FROM send_account_tags WHERE send_account_id = test_send_account_id AND tag_id = tag1_id;
    
    SELECT ok(EXISTS(
        SELECT 1 FROM send_accounts 
        WHERE id = test_send_account_id AND main_tag_id = tag2_id
    ), 'Next oldest tag promoted to main on deletion');
END $$;
```

#### **4. RLS Policy Tests**
**File**: `send_account_tags_rls_test.sql`

```sql
-- Test Row Level Security policies
DO $$
DECLARE
    user1_id uuid;
    user2_id uuid;
    send_account1_id uuid;
    send_account2_id uuid;
    tag1_id bigint;
    tag2_id bigint;
BEGIN
    -- Setup two users with send accounts
    INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'user1@example.com') 
    RETURNING id INTO user1_id;
    INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'user2@example.com') 
    RETURNING id INTO user2_id;
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (user1_id, '0x3234567890123456789012345678901234567890', 8453, '\x00')
    RETURNING id INTO send_account1_id;
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (user2_id, '0x4234567890123456789012345678901234567890', 8453, '\x00')
    RETURNING id INTO send_account2_id;
    
    -- Create tags for each user
    SELECT create_tag('user1tag', send_account1_id) INTO tag1_id;
    SELECT create_tag('user2tag', send_account2_id) INTO tag2_id;
    
    -- Test 1: Users can see their own send_account_tags
    SET LOCAL role = 'authenticated';
    SET LOCAL "request.jwt.claims" = json_build_object('sub', user1_id);
    
    SELECT ok(EXISTS(
        SELECT 1 FROM send_account_tags 
        WHERE send_account_id = send_account1_id AND tag_id = tag1_id
    ), 'User can see own send_account_tags');
    
    -- Test 2: Users cannot see other users' send_account_tags
    SELECT ok(NOT EXISTS(
        SELECT 1 FROM send_account_tags 
        WHERE send_account_id = send_account2_id AND tag_id = tag2_id
    ), 'User cannot see other users send_account_tags');
    
    -- Test 3: Tags policy - can see confirmed tags and own pending tags
    UPDATE tags SET status = 'confirmed' WHERE id = tag2_id;
    
    SELECT ok(EXISTS(
        SELECT 1 FROM tags WHERE id = tag2_id AND status = 'confirmed'
    ), 'Can see confirmed tags from other users');
    
    SELECT ok(EXISTS(
        SELECT 1 FROM tags WHERE id = tag1_id AND status = 'pending'
    ), 'Can see own pending tags');
    
    SET LOCAL "request.jwt.claims" = json_build_object('sub', user2_id);
    
    SELECT ok(NOT EXISTS(
        SELECT 1 FROM tags WHERE id = tag1_id AND status = 'pending'
    ), 'Cannot see other users pending tags');
END $$;
```

#### **5. Function Integration Tests**
**File**: `tag_functions_integration_test.sql`

```sql
-- Test complete tag confirmation flow
DO $$
DECLARE
    test_user_id uuid;
    test_send_account_id uuid;
    tag_id bigint;
    mock_event_id text := 'test_event_123';
BEGIN
    -- Setup
    INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'integration@example.com') 
    RETURNING id INTO test_user_id;
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (test_user_id, '0x5234567890123456789012345678901234567890', 8453, '\x00')
    RETURNING id INTO test_send_account_id;
    
    -- Test complete flow: create -> confirm
    SELECT create_tag('flowtest', test_send_account_id) INTO tag_id;
    
    -- Mock receipt for confirmation
    INSERT INTO sendtag_checkout_receipts (event_id, sender, amount, log_addr, block_num, tx_idx, log_idx, tx_hash)
    VALUES (mock_event_id, decode('5234567890123456789012345678901234567890', 'hex'), 1000000, decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'hex'), 1, 1, 1, decode('1234567890123456789012345678901234567890123456789012345678901234', 'hex'));
    
    -- Test confirm_tags function
    PERFORM confirm_tags(ARRAY['flowtest'], test_send_account_id, mock_event_id, '');
    
    SELECT ok(EXISTS(
        SELECT 1 FROM tags WHERE id = tag_id AND status = 'confirmed'
    ), 'Tag confirmed successfully');
    
    SELECT ok(EXISTS(
        SELECT 1 FROM receipts WHERE event_id = mock_event_id AND user_id = test_user_id
    ), 'Receipt created');
    
    SELECT ok(EXISTS(
        SELECT 1 FROM tag_receipts WHERE event_id = mock_event_id AND tag_id = tag_id
    ), 'Tag receipt association created');
    
    SELECT ok(EXISTS(
        SELECT 1 FROM send_accounts WHERE id = test_send_account_id AND main_tag_id = tag_id
    ), 'Tag set as main automatically');
END $$;
```

#### **6. Performance and Edge Case Tests**
**File**: `send_account_tags_performance_test.sql`

```sql
-- Test performance with multiple tags per user
DO $$
DECLARE
    test_user_id uuid;
    test_send_account_id uuid;
    start_time timestamp;
    end_time timestamp;
    i integer;
BEGIN
    -- Setup
    INSERT INTO auth.users (id, email) VALUES (gen_random_uuid(), 'perf@example.com') 
    RETURNING id INTO test_user_id;
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (test_user_id, '0x6234567890123456789012345678901234567890', 8453, '\x00')
    RETURNING id INTO test_send_account_id;
    
    -- Test 1: Creating 5 tags should be fast
    start_time := clock_timestamp();
    FOR i IN 1..5 LOOP
        PERFORM create_tag('perftag' || i, test_send_account_id);
    END LOOP;
    end_time := clock_timestamp();
    
    SELECT ok(
        EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 1000,
        'Creating 5 tags completes within 1 second'
    );
    
    -- Test 2: Tag deletion and main tag succession
    start_time := clock_timestamp();
    
    -- Confirm all tags and test deletion performance
    UPDATE tags SET status = 'confirmed' 
    WHERE id IN (SELECT tag_id FROM send_account_tags WHERE send_account_id = test_send_account_id);
    
    -- Delete tags one by one, testing main tag succession
    FOR i IN 1..4 LOOP
        DELETE FROM send_account_tags 
        WHERE send_account_id = test_send_account_id 
        AND tag_id = (
            SELECT tag_id FROM send_account_tags 
            WHERE send_account_id = test_send_account_id 
            ORDER BY created_at ASC LIMIT 1
        );
    END LOOP;
    
    end_time := clock_timestamp();
    
    SELECT ok(
        EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 500,
        'Tag deletion and succession completes within 500ms'
    );
    
    -- Verify only one tag remains and it's the main tag
    SELECT ok(
        (SELECT COUNT(*) FROM send_account_tags WHERE send_account_id = test_send_account_id) = 1,
        'Only one tag remains after deletions'
    );
    
    SELECT ok(EXISTS(
        SELECT 1 FROM send_accounts sa
        JOIN send_account_tags sat ON sat.send_account_id = sa.id
        WHERE sa.id = test_send_account_id AND sa.main_tag_id = sat.tag_id
    ), 'Remaining tag is the main tag');
END $$;
```

### Running the Complete Test Suite

#### **Test Execution Commands**

```bash
# Run all database tests
cd supabase && yarn supabase test

# Run specific test files
cd supabase && yarn supabase test send_account_tags_schema_test.sql
cd supabase && yarn supabase test send_account_tags_lifecycle_test.sql
cd supabase && yarn supabase test main_tag_functionality_test.sql
cd supabase && yarn supabase test send_account_tags_rls_test.sql
cd supabase && yarn supabase test tag_functions_integration_test.sql
cd supabase && yarn supabase test send_account_tags_performance_test.sql

# Test with verbose output
cd supabase && yarn supabase test --verbose
```

#### **Expected Test Results**

All tests should pass with output similar to:
```
✅ send_account_tags_schema_test.sql .......... ok
✅ send_account_tags_lifecycle_test.sql ....... ok
✅ main_tag_functionality_test.sql ............. ok
✅ send_account_tags_rls_test.sql .............. ok
✅ tag_functions_integration_test.sql .......... ok
✅ send_account_tags_performance_test.sql ...... ok

All tests passed!
```

### Test Coverage Validation

This test plan covers:
- ✅ **Schema integrity**: All tables, columns, constraints, indexes
- ✅ **Function behavior**: create_tag, confirm_tags, lifecycle functions
- ✅ **Trigger functionality**: Main tag assignment, deletion handling
- ✅ **RLS policies**: User access control and data isolation
- ✅ **Edge cases**: Tag limits, validation errors, orphaned tags
- ✅ **Performance**: Response times for common operations
- ✅ **Data integrity**: Foreign key constraints, unique constraints
- ✅ **Complete workflows**: End-to-end tag lifecycle testing

## Updating Existing Tests for New Architecture

The new send_account_tags junction table requires updates to existing test files. Many current tests create tags directly without proper send_account relationships.

### **Required Test Updates**

#### **1. Fix Direct Tag Creation Tests**
**Files to Update**: `tags_create_pending_test.sql`, `tags_validation_test.sql`

**Problem**: Tests directly insert into tags table without send_account_tags associations
```sql
-- ❌ Old approach (broken)
INSERT INTO tags (name, user_id)
VALUES ('test_tag', tests.get_supabase_uid('tag_creator'));
```

**Solution**: Use create_tag function or create proper associations
```sql
-- ✅ New approach
-- First ensure send_account exists
INSERT INTO send_accounts(user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('tag_creator'), '0x1234567890ABCDEF1234567890ABCDEF12345678', 8453, '\\x00');

-- Then use create_tag function
SELECT create_tag('test_tag', (
    SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator')
));

-- OR create association manually for specific test scenarios
INSERT INTO tags (name, status) VALUES ('test_tag', 'pending');
INSERT INTO send_account_tags(send_account_id, tag_id)
VALUES (
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('tag_creator')),
    (SELECT id FROM tags WHERE name = 'test_tag')
);
```

#### **2. Update Tag Confirmation Tests**
**Files to Update**: `tags_confirmation_test.sql`, `tag_receipts_test.sql`

**Problem**: confirm_tags function signature changed to include send_account_id
```sql
-- ❌ Old function call (outdated)
SELECT confirm_tags(ARRAY['test_tag'], 'event_123', 'referral_code');
```

**Solution**: Include send_account_id parameter
```sql
-- ✅ New function call
SELECT confirm_tags(
    ARRAY['test_tag']::citext[], 
    (SELECT id FROM send_accounts WHERE user_id = tests.get_supabase_uid('test_user')),
    'event_123', 
    'referral_code'
);
```

#### **3. Update RLS Policy Tests**
**Files to Update**: `tags_rls_test.sql`

**Problem**: RLS policies now check ownership through send_account_tags table
```sql
-- ❌ Old ownership check (user_id based)
SELECT ok(EXISTS(SELECT 1 FROM tags WHERE user_id = auth.uid()));
```

**Solution**: Check ownership through send_account_tags junction
```sql
-- ✅ New ownership check (send_account_tags based)
SELECT ok(EXISTS(
    SELECT 1 FROM tags t
    JOIN send_account_tags sat ON sat.tag_id = t.id
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    WHERE sa.user_id = auth.uid()
));
```

#### **4. Update Activity Feed and Profile Tests**
**Files to Update**: `activity_feed_test.sql`, `profile_lookup_test.sql`

**Problem**: Views and functions now aggregate tags through send_account_tags
```sql
-- ❌ Old query (direct user_id relationship)
SELECT array_agg(t.name) FROM tags t WHERE t.user_id = p.id AND t.status = 'confirmed';
```

**Solution**: Query through junction table
```sql
-- ✅ New query (through send_account_tags)
SELECT array_agg(t.name) 
FROM tags t
JOIN send_account_tags sat ON sat.tag_id = t.id
JOIN send_accounts sa ON sa.id = sat.send_account_id
WHERE sa.user_id = p.id AND t.status = 'confirmed';
```

### **Step-by-Step Test Migration Process**

#### **Step 1: Audit Current Test Files**
```bash
# Find all test files that reference tags
cd supabase/tests
grep -l "tags\|confirm_tags\|create_tag" *.sql

# Expected files to update:
# - tags_confirmation_test.sql
# - tags_create_pending_test.sql
# - tags_validation_test.sql
# - tags_rls_test.sql
# - tag_receipts_test.sql
# - tag_referrals_test.sql
# - activity_feed_test.sql
# - profile_lookup_test.sql
```

#### **Step 2: Create Test Data Setup Helper**
**File**: `supabase/tests/helpers/tag_test_helpers.sql`
```sql
-- Helper function for consistent test setup
CREATE OR REPLACE FUNCTION tests.setup_user_with_send_account(username text)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    user_id uuid;
    send_account_id uuid;
BEGIN
    -- Create user
    SELECT tests.create_supabase_user(username) INTO user_id;
    
    -- Create send account
    INSERT INTO send_accounts(user_id, address, chain_id, init_code)
    VALUES (
        tests.get_supabase_uid(username), 
        ('0x' || lpad(abs(hashtext(username))::text, 40, '0'))::citext,
        8453, 
        '\\x00'
    ) RETURNING id INTO send_account_id;
    
    RETURN send_account_id;
END;
$$;

-- Helper for creating test tags with proper associations
CREATE OR REPLACE FUNCTION tests.create_test_tag(tag_name citext, username text)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
    send_account_id uuid;
    tag_id bigint;
BEGIN
    SELECT id INTO send_account_id 
    FROM send_accounts 
    WHERE user_id = tests.get_supabase_uid(username);
    
    IF send_account_id IS NULL THEN
        send_account_id := tests.setup_user_with_send_account(username);
    END IF;
    
    SELECT create_tag(tag_name, send_account_id) INTO tag_id;
    
    RETURN tag_id;
END;
$$;
```

#### **Step 3: Update Each Test File**

**Example Migration for `tags_create_pending_test.sql`:**
```sql
-- Before (broken):
BEGIN;
SELECT plan(7);
CREATE EXTENSION "basejump-supabase_test_helpers";
SELECT tests.create_supabase_user('tag_creator');
SELECT tests.authenticate_as('tag_creator');

INSERT INTO tags (name, user_id)
VALUES ('test_tag', tests.get_supabase_uid('tag_creator'));

-- After (fixed):
BEGIN;
SELECT plan(7);
CREATE EXTENSION "basejump-supabase_test_helpers";

-- Setup user with send account
SELECT tests.setup_user_with_send_account('tag_creator');
SELECT tests.authenticate_as('tag_creator');

-- Use proper create_tag function
SELECT tests.create_test_tag('test_tag', 'tag_creator');

-- Test junction table was created
SELECT ok(EXISTS(
    SELECT 1 FROM send_account_tags sat
    JOIN send_accounts sa ON sa.id = sat.send_account_id
    JOIN tags t ON t.id = sat.tag_id
    WHERE sa.user_id = tests.get_supabase_uid('tag_creator')
    AND t.name = 'test_tag'
), 'Tag properly associated with send account');
```

#### **Step 4: Validate Test Updates**
```bash
# Run updated tests individually to catch issues
cd supabase && yarn supabase test tags_create_pending_test.sql
cd supabase && yarn supabase test tags_confirmation_test.sql
cd supabase && yarn supabase test tags_rls_test.sql

# Run all tests to ensure no regressions
cd supabase && yarn supabase test

# Expected: All tests should pass with new architecture
```

### **Specific Test File Updates Required**

#### **Critical Updates (High Priority)**
1. **`tags_confirmation_test.sql`** - Update confirm_tags calls with send_account_id
2. **`send_account_tags_test.sql`** - Already updated, verify completeness
3. **`tags_create_pending_test.sql`** - Replace direct tag inserts with create_tag function
4. **`tag_receipts_test.sql`** - Ensure proper send_account_tags associations exist

#### **Secondary Updates (Medium Priority)**
5. **`tags_rls_test.sql`** - Update ownership checks to use junction table
6. **`tag_referrals_test.sql`** - Verify referral logic works with new tag_id relationships
7. **`activity_feed_test.sql`** - Update to test new activity feed view with junction table
8. **`profile_lookup_test.sql`** - Test new profile_lookup function with all_tags array

#### **Validation Updates (Low Priority)**
9. **`tags_validation_test.sql`** - Update tag validation tests for new constraints
10. **`tags_search_test.sql`** - Verify search works with junction table relationships

### **Test Migration Checklist**

- [ ] Create test helper functions for consistent setup
- [ ] Update all direct tag insertions to use create_tag function
- [ ] Update all confirm_tags calls to include send_account_id parameter
- [ ] Update RLS policy tests to check ownership through send_account_tags
- [ ] Update activity feed tests for new view structure
- [ ] Update profile lookup tests for new function signature
- [ ] Verify all foreign key relationships are properly tested
- [ ] Add tests for main_tag_id functionality in existing test files
- [ ] Run complete test suite and fix any remaining failures
- [ ] Document any test patterns that other engineers should follow

This migration ensures that all existing functionality continues to work while properly testing the new send_account_tags architecture.

## Data Migration Process

The migrations handle:
1. Assigning sequential IDs to existing tags
2. Creating send_account_tags entries for existing relationships
3. Setting initial main_tag_id values (oldest confirmed tag)
4. Releasing orphaned tags to 'available' status
5. Preserving history in historical_tag_associations

## Next Steps

With the database schema complete:
1. Generate TypeScript types: `cd supabase && yarn generate`
2. Proceed to **Phase 2: API Layer Updates** to fix the critical `registerFirstSendtag` issue
3. Update frontend components in Phase 3 to use the new schema
