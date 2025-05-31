# Sendtags (Tags) System: Complete Guide

## What Are Sendtags?

**Sendtags** (also called "tags") are unique usernames in the Send app that serve as human-readable identifiers for users. Think of them as "/handles" similar to Twitter usernames (but uses a /-prefixed string when sharing on social media), but in the context of cryptocurrency payments and social features.

### Key Characteristics
- **Unique**: Each sendtag is globally unique across the entire Send app
- **User-friendly**: Alphanumeric strings (1-20 characters, A-Z, a-z, 0-9, underscore)
- **Payment identifiers**: Users can send money to each other using sendtags instead of wallet addresses
- **Social identity**: Sendtags appear in activity feeds, profiles, and social interactions
- **Multiple per user**: Each user can own up to 5 sendtags under their Send account

### Example Use Cases
- Sending money: "Send $10 to /alice" instead of a long wallet address
- Social features: "/bob liked your transaction"
- Identity: Users choose a primary "main" sendtag for their public profile

## Database Schema Overview

The sendtag system uses three main database tables working together:

### 1. `tags` Table (Core Tag Data)
```sql
CREATE TABLE "public"."tags" (
    "id" bigint PRIMARY KEY,           -- Unique numeric ID
    "name" citext NOT NULL UNIQUE,    -- The actual sendtag (e.g., "alice")
    "status" tag_status NOT NULL,     -- pending/confirmed/available
    "user_id" uuid,                   -- Links to auth.users (nullable)
    "created_at" timestamp,
    "updated_at" timestamp
);
```

### 2. `send_account_tags` Table (Junction/Association)
```sql
CREATE TABLE "public"."send_account_tags" (
    "id" serial PRIMARY KEY,
    "send_account_id" uuid NOT NULL,  -- Links to send_accounts
    "tag_id" bigint NOT NULL,         -- Links to tags
    "created_at" timestamp,
    "updated_at" timestamp
);
```

### 3. `send_accounts` Table (User's Main Tag)
```sql
CREATE TABLE "public"."send_accounts" (
    -- ... other fields ...
    "main_tag_id" bigint,            -- Points to user's primary tag
    -- Foreign key to tags(id) ON DELETE SET NULL
);
```

### Relationship Model
```
User (auth.users)
     ↓ 1:1
Send Account (send_accounts) ←──┐
     ↓ 1:N                      │ main_tag_id
Send Account Tags (junction)    │ (foreign key)
     ↓ N:1                      │
Tags (tags) ────────────────────┘
```

## Tag Status Lifecycle

Each tag goes through different status states during its lifetime:

### Status Enum
```sql
CREATE TYPE "public"."tag_status" AS ENUM (
    'pending',    -- User claimed tag but hasn't paid
    'confirmed',  -- User paid and tag is active
    'available'   -- Tag was released and can be claimed again
);
```

### Lifecycle Flow
1. **Creation**: User creates a tag → `status = 'pending'`
2. **Payment**: User pays for tag → `status = 'confirmed'`
3. **Release**: User deletes tag → `status = 'available'` (if no other associations)
4. **Reuse**: Another user can claim available tags → back to `'pending'`

### Important Notes
- Only `confirmed` tags can be used for payments and social features
- Only `confirmed` tags can be set as a user's main tag
- `available` tags are recycled - they keep their name but get new ownership
- Users have 30 minutes to pay for `pending` tags before they expire

## Row Level Security (RLS) Policies

The tags table uses PostgreSQL RLS to control data access:

### SELECT Policy
```sql
CREATE POLICY "select_policy" ON "public"."tags" FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM send_account_tags sat
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sat.tag_id = tags.id
        AND sa.user_id = (SELECT auth.uid())
    )
);
```
**Purpose**: Users can only see tags they own (via the junction table)

### INSERT Policy
```sql
CREATE POLICY "insert_policy" ON "public"."tags" FOR INSERT
WITH CHECK (
    ((SELECT auth.uid()) = user_id AND user_id IS NOT NULL)
);
```
**Purpose**: Users can only create tags with their own `user_id`

### UPDATE Policy
```sql
CREATE POLICY "update_policy" ON "public"."tags" FOR UPDATE TO "authenticated"
USING (
    status = 'pending'::public.tag_status
    AND EXISTS (
        SELECT 1
        FROM send_account_tags sat
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sat.tag_id = tags.id
        AND sa.user_id = (SELECT auth.uid())
    )
)
```
**Purpose**: Users can only update their own `pending` tags

### DELETE Policy
```sql
CREATE POLICY "delete_policy" ON "public"."tags" FOR DELETE TO "authenticated"
USING (
    status = 'pending'::public.tag_status
    AND EXISTS (
        SELECT 1
        FROM send_account_tags sat
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sat.tag_id = tags.id
        AND sa.user_id = (SELECT auth.uid())
    )
);
```
**Purpose**: Users can only delete their own `pending` tags

**Important Note**: Direct deletion from the `tags` table is restricted to `pending` tags only. For confirmed tags, users must delete from the `send_account_tags` junction table instead, which provides more sophisticated release functionality.

## Key SQL Functions

### 1. `create_tag(tag_name, send_account_id)`
**Purpose**: Creates a new tag for a user's send account

**Key Logic**:
- Validates user owns the send account
- Enforces 5-tag limit per user
- Handles tag reuse (updates `available` tags instead of creating duplicates)
- Creates junction table entry (`send_account_tags`)

```sql
-- Example usage
SELECT create_tag('alice', 'user-send-account-uuid');
```

### 2. `confirm_tags(tag_names[], send_account_id, event_id, referral_code)`
**Purpose**: Confirms multiple tags after payment is verified

**Key Logic**:
- Verifies payment via blockchain event
- Updates tag status from `pending` to `confirmed`
- Creates junction table entries if missing
- Handles referral codes
- Triggers main tag assignment for first confirmed tag

```sql
-- Example usage (called by backend after payment verification)
SELECT confirm_tags(ARRAY['alice', 'alice_work'], 'send-account-uuid', 'blockchain-event-id', 'referral123');
```

### 3. `handle_tag_confirmation()` (Trigger Function)
**Purpose**: Automatically sets first confirmed tag as main tag

**Trigger**: `AFTER UPDATE ON tags WHEN NEW.status = 'confirmed'`

```sql
-- Auto-executed logic
UPDATE send_accounts sa
SET main_tag_id = NEW.id
FROM send_account_tags sat
WHERE sat.tag_id = NEW.id
    AND sat.send_account_id = sa.id
    AND sa.main_tag_id IS NULL; -- Only if no main tag set
```

### 4. `handle_send_account_tags_deleted()` (Trigger Function)
**Purpose**: Manages tag cleanup and main tag succession when tags are deleted

**Trigger**: `AFTER DELETE ON send_account_tags`

**Key Logic**:
- Sets tag status to `available` if no other associations exist
- Promotes next oldest confirmed tag to main if deleted tag was main
- Clears `user_id` for recycled tags

### 5. `validate_main_tag_update()` (Trigger Function)
**Purpose**: Ensures data integrity for main tag assignments

**Trigger**: `BEFORE UPDATE OF main_tag_id ON send_accounts`

**Validation Rules**:
- Cannot set `main_tag_id` to NULL if user has confirmed tags
- `main_tag_id` must be one of user's confirmed tags
- Prevents orphaned or invalid main tag references

### 6. `tag_search(query, limit_val, offset_val)`
**Purpose**: Search for users by sendtag, send ID, or phone number

**Returns**: Arrays of search results for different match types
- `send_id_matches`: Numeric send ID matches
- `tag_matches`: Sendtag name matches (fuzzy matching)
- `phone_matches`: Phone number matches

## Database Constraints and Indexes

### Constraints
```sql
-- Tag name validation
ALTER TABLE "tags" ADD CONSTRAINT "tags_name_check"
CHECK ((length(name::text) >= 1) AND (length(name::text) <= 20)
       AND (name ~ '^[A-Za-z0-9_]+$'::citext));

-- Unique tag names globally
ALTER TABLE "tags" ADD CONSTRAINT "tags_name_unique" UNIQUE ("name");

-- Foreign key relationships
ALTER TABLE "send_account_tags" ADD CONSTRAINT "send_account_tags_tag_id_fkey"
FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE;

ALTER TABLE "send_accounts" ADD CONSTRAINT "send_accounts_main_tag_id_fkey"
FOREIGN KEY ("main_tag_id") REFERENCES "tags"("id") ON DELETE SET NULL;
```

### Performance Indexes
```sql
-- Tag search optimization
CREATE INDEX "tags_name_trigram_gin_idx" ON "tags"
USING gin (name gin_trgm_ops);

-- Status filtering
CREATE INDEX "idx_tags_status" ON "tags" (status)
WHERE status = 'available';

-- Junction table lookups
CREATE INDEX "idx_send_account_tags_tag_id" ON "send_account_tags" (tag_id);
CREATE INDEX "idx_send_account_tags_send_account_id" ON "send_account_tags" (send_account_id);

-- Main tag lookups
CREATE INDEX "idx_send_accounts_main_tag_id" ON "send_accounts" (main_tag_id);
```

## Tag Deletion and Release System

The new send account tags feature introduces a sophisticated two-level deletion system that allows users to release both pending and confirmed tags.

### Two Deletion Mechanisms

#### 1. Direct Tag Deletion (Pending Tags Only)
```sql
-- Users can delete pending tags directly from the tags table
DELETE FROM tags WHERE id = ? AND status = 'pending';
```
- **Restriction**: Only works for `pending` tags (unpaid)
- **Enforced by**: RLS delete policy on `tags` table
- **Use case**: Cancel a tag reservation before payment

#### 2. Junction Table Deletion (All Tag Types)
```sql
-- Users can "release" any tag by deleting the association
DELETE FROM send_account_tags WHERE tag_id = ? AND send_account_id = ?;
```
- **Works for**: Both `pending` and `confirmed` tags
- **Enforced by**: RLS delete policy on `send_account_tags` table
- **Use case**: Release confirmed tags back to the system

### How Tag Release Works for Confirmed Tags

When a user deletes from `send_account_tags`, the system automatically handles tag cleanup:

#### Step 1: Junction Record Deletion
```sql
-- User deletes their association to the tag
DELETE FROM send_account_tags
WHERE tag_id = 123 AND send_account_id = 'user-uuid';
```

#### Step 2: Automatic Tag Status Update (Trigger)
The `handle_send_account_tags_deleted()` trigger function executes:

```sql
-- If no other users are associated with this tag, make it available for reuse
UPDATE tags t
SET
    status = 'available',
    user_id = NULL,
    updated_at = NOW()
WHERE
    t.id = OLD.tag_id
    AND NOT EXISTS(
        SELECT 1
        FROM send_account_tags sat
        WHERE sat.tag_id = t.id
    );
```

#### Step 3: Main Tag Succession (If Applicable)
If the deleted tag was the user's main tag, automatically promote the next oldest confirmed tag:

```sql
-- Promote next oldest confirmed tag to main
UPDATE send_accounts sa
SET main_tag_id = (
    SELECT t.id
    FROM send_account_tags sat
    JOIN tags t ON t.id = sat.tag_id
    WHERE sat.send_account_id = OLD.send_account_id
        AND t.status = 'confirmed'
        AND t.id != OLD.tag_id -- Don't select the tag being deleted
    ORDER BY sat.created_at ASC
    LIMIT 1
)
WHERE sa.id = OLD.send_account_id
    AND sa.main_tag_id = OLD.tag_id;
```

### Tag Reuse and Availability

#### Available Tag Status
- **Purpose**: Released confirmed tags become `available` for other users to claim
- **Behavior**: Tag name is preserved but ownership is cleared (`user_id = NULL`)
- **Benefit**: Popular tag names can be reused instead of being permanently locked

#### Tag Claiming Process
When a user tries to create a tag that's `available`:

```sql
-- The create_tag() function prioritizes available tags
WITH available_tag AS (
    UPDATE tags
    SET
        status = 'pending',
        user_id = auth.uid(),
        updated_at = NOW()
    WHERE
        name = tag_name
        AND status = 'available'
    RETURNING id
),
new_tag AS (
    -- Only create new tag if no available tag was found
    INSERT INTO tags(name, status, user_id)
    SELECT tag_name, 'pending', auth.uid()
    WHERE NOT EXISTS (SELECT 1 FROM available_tag)
    RETURNING id
)
-- Create junction table entry for whichever tag was used
INSERT INTO send_account_tags(send_account_id, tag_id)
SELECT send_account_id, id FROM available_tag
UNION ALL
SELECT send_account_id, id FROM new_tag;
```

### API Implementation for Tag Deletion

#### Frontend Delete Options
Users have two deletion options in the UI:

1. **Cancel Pending Tag** (for unpaid tags)
```typescript
// Direct deletion from tags table
const { error } = await supabase
  .from('tags')
  .delete()
  .eq('id', tagId)
  .eq('status', 'pending');
```

2. **Release Confirmed Tag** (for paid tags)
```typescript
// Delete association from junction table
const { error } = await supabase
  .from('send_account_tags')
  .delete()
  .eq('tag_id', tagId)
  .eq('send_account_id', sendAccountId);
```

#### Database-Level Security
- **RLS Policies**: Ensure users can only delete their own tag associations
- **Trigger Validation**: Prevents deletion of main tags if other confirmed tags exist
- **Automatic Cleanup**: Handles tag status updates and main tag succession

### Benefits of the New System

1. **Tag Recycling**: Popular confirmed tags can be reused by other users
2. **Flexible Deletion**: Users can release confirmed tags, not just pending ones
3. **Automatic Management**: Main tag succession happens automatically
4. **Data Integrity**: Triggers ensure consistent state transitions
5. **Historical Tracking**: `historical_tag_associations` table preserves ownership history

### Example User Flow

1. **User owns confirmed tags**: `/alice`, `/alice_work`, `/alice123` (main tag: `/alice`)
2. **User releases main tag**: Deletes `/alice` from `send_account_tags`
3. **System automatically**:
   - Sets `/alice` status to `available` (can be claimed by others)
   - Promotes `/alice_work` to main tag (next oldest)
   - User still owns `/alice_work` and `/alice123`
4. **Tag becomes reusable**: Another user can now claim `/alice`

This system provides much more flexibility than the original design where users could only delete pending tags.

---

# Main Sendtag Implementation Approach

## Overview

The main sendtag feature allows users to designate one of their confirmed tags as their primary identity across the Send app. This document outlines the minimal-change approach to implement this functionality.

## Database Design Philosophy

### Minimal Changes
- Single column addition: `main_tag_id` on `send_accounts` table
- No changes to existing tag operations or APIs
- Backward compatible with existing code

### Automatic Behavior
- First confirmed tag automatically becomes main
- Deleting main tag automatically promotes next tag
- No manual intervention required for basic functionality

## Declarative Schema Changes

### 1. send_accounts.sql
```sql
-- Add main tag column
"main_tag_id" bigint,

-- Foreign key with cascade behavior
ADD CONSTRAINT "send_accounts_main_tag_id_fkey"
    FOREIGN KEY ("main_tag_id")
    REFERENCES "public"."tags"("id")
    ON DELETE SET NULL;

-- Performance index
CREATE INDEX "idx_send_accounts_main_tag_id"
    ON "public"."send_accounts"
    USING "btree" ("main_tag_id");

-- Validation trigger
CREATE TRIGGER "validate_main_tag_update"
    BEFORE UPDATE OF main_tag_id ON "public"."send_accounts"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."validate_main_tag_update"();
```

### 2. tags.sql
```sql
-- Auto-set main tag on confirmation
CREATE TRIGGER "set_main_tag_on_confirmation"
    AFTER UPDATE ON "public"."tags"
    FOR EACH ROW
    WHEN(NEW.status = 'confirmed'::public.tag_status)
    EXECUTE FUNCTION "public"."handle_tag_confirmation"();
```

### 3. send_account_tags.sql
```sql
-- Handle main tag succession on deletion
CREATE TRIGGER "send_account_tags_deleted"
    AFTER DELETE ON "public"."send_account_tags"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_send_account_tags_deleted"();
```

## Key Functions

### validate_main_tag_update()
Ensures data integrity when updating main_tag_id:
- Prevents NULL when confirmed tags exist
- Validates tag ownership through send_account_tags
- Raises exceptions on invalid operations

### handle_tag_confirmation()
Automatically sets first confirmed tag as main:
```sql
UPDATE send_accounts sa
SET main_tag_id = NEW.id
FROM send_account_tags sat
WHERE sat.tag_id = NEW.id
    AND sat.send_account_id = sa.id
    AND sa.main_tag_id IS NULL;
```

### handle_send_account_tags_deleted()
Handles main tag succession when deleting:
```sql
-- Select next oldest confirmed tag
UPDATE send_accounts sa
SET main_tag_id = (
    SELECT t.id
    FROM send_account_tags sat
    JOIN tags t ON t.id = sat.tag_id
    WHERE sat.send_account_id = OLD.send_account_id
        AND t.status = 'confirmed'
        AND t.id != OLD.tag_id
    ORDER BY sat.created_at ASC
    LIMIT 1
)
WHERE sa.id = OLD.send_account_id
    AND sa.main_tag_id = OLD.tag_id;
```

## API Implementation

### Minimal API Changes Required

1. **Existing endpoints work unchanged**
   - Tag creation/confirmation automatically handles main tag
   - Tag deletion automatically handles succession

2. **Single new endpoint for manual selection**
   ```typescript
   // Update main tag
   async function updateMainTag(tagId: number) {
     await supabase
       .from('send_accounts')
       .update({ main_tag_id: tagId })
       .eq('user_id', userId);
     // Database trigger validates ownership
   }
   ```

3. **Query pattern for retrieving tags**
   ```sql
   SELECT
     t.*,
     (t.id = sa.main_tag_id) as is_main
   FROM tags t
   JOIN send_account_tags sat ON sat.tag_id = t.id
   JOIN send_accounts sa ON sa.id = sat.send_account_id
   WHERE sa.user_id = auth.uid()
   ```

## Frontend Integration

### Display Logic
```typescript
// Get user's main tag for display
const getMainTag = (tags: Tag[], mainTagId: number | null) => {
  if (!mainTagId) return tags[0]; // Fallback
  return tags.find(t => t.id === mainTagId) || tags[0];
};

// Profile header
<ProfileHeader tag={getMainTag(user.tags, user.mainTagId)} />
```

### Tag Management UI
```typescript
// Radio button selection
<TagList>
  {tags.map(tag => (
    <TagItem key={tag.id}>
      <RadioButton
        checked={tag.id === mainTagId}
        onChange={() => updateMainTag(tag.id)}
        disabled={tag.status !== 'confirmed'}
      />
      <TagName>{tag.name}</TagName>
    </TagItem>
  ))}
</TagList>
```

## Migration Strategy

### For Existing Users
1. Run migration to set main_tag_id to oldest confirmed tag:
   ```sql
   UPDATE send_accounts sa
   SET main_tag_id = (
     SELECT t.id
     FROM send_account_tags sat
     JOIN tags t ON t.id = sat.tag_id
     WHERE sat.send_account_id = sa.id
       AND t.status = 'confirmed'
     ORDER BY sat.created_at ASC
     LIMIT 1
   )
   WHERE sa.main_tag_id IS NULL;
   ```

### For New Users
- Automatic assignment via triggers
- No special handling required

## Benefits of This Approach

1. **Minimal Database Changes**
   - Single column addition
   - Three trigger functions
   - No table structure changes

2. **Zero Breaking Changes**
   - Existing APIs continue to work
   - Old clients function without modification
   - Gradual rollout possible

3. **Data Integrity**
   - Database-enforced constraints
   - Automatic state management
   - No orphaned references

4. **Performance**
   - Indexed foreign key
   - No additional queries for basic operations
   - Efficient tag lookups

## Testing Considerations

### Database Tests
```sql
-- Test automatic main tag assignment
INSERT INTO tags (name, status) VALUES ('test', 'pending');
-- Confirm tag
UPDATE tags SET status = 'confirmed' WHERE name = 'test';
-- Verify main_tag_id is set

-- Test succession on deletion
DELETE FROM send_account_tags WHERE tag_id = ?;
-- Verify next tag becomes main

-- Test validation
UPDATE send_accounts SET main_tag_id = 999; -- Should fail
```

### API Tests
- Verify tag operations maintain main tag state
- Test manual main tag updates
- Ensure proper error handling

### UI Tests
- Main tag displays correctly
- Radio button selection works
- Handles edge cases (no tags, pending tags)

## Rollback Plan

If issues arise:
```sql
-- Remove triggers
DROP TRIGGER validate_main_tag_update ON send_accounts;
DROP TRIGGER set_main_tag_on_confirmation ON tags;
DROP TRIGGER send_account_tags_deleted ON send_account_tags;

-- Remove column (after ensuring no dependencies)
ALTER TABLE send_accounts DROP COLUMN main_tag_id;
```

## Summary

This approach achieves main sendtag functionality with:
- **1 new column**
- **3 trigger functions**
- **1 new API endpoint**
- **Zero breaking changes**

The implementation leverages PostgreSQL's capabilities to maintain data integrity while keeping the application layer simple and backward compatible.
