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