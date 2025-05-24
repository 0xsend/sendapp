# Phase 1: Database Schema & Migrations

**GitHub Issue**: [#1520 - Fix database migration issues](https://github.com/0xsend/sendapp/issues/1520) & [#1521 - Add missing database indexes](https://github.com/0xsend/sendapp/issues/1521)

## Objective

Implement the database foundation for multiple sendtags per send account with a main tag concept.

## Schema Changes

### New Junction Table: `send_account_tags`
```sql
CREATE TABLE send_account_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  send_account_id UUID NOT NULL REFERENCES send_accounts(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(send_account_id, tag_id)
);
```

### New Column: `send_accounts.main_tag_id`
```sql
ALTER TABLE send_accounts 
ADD COLUMN main_tag_id INTEGER REFERENCES tags(id);
```

### Tags Table Updates
- `id` column added as new primary key (was `name`)
- `user_id` made nullable (tags can exist without owner)
- `updated_at` column with automatic timestamp trigger
- `name` remains unique constraint

## Migration Files

### 1. `20250524000001_add_tag_id.sql`
**Purpose**: Add numeric IDs to existing tags

**Key Operations**:
- Add `id` column to tags table
- Generate sequential IDs for existing tags
- Update foreign key references in `tag_receipts` and `referrals`
- Transition from name-based to ID-based references

### 2. `20250524000003_sendtag_updates.sql`
**Purpose**: Create junction table and set main tags

**Key Operations**:
- Create `send_account_tags` table
- Populate with existing user-tag relationships
- Set initial main tags (oldest confirmed tag per user)
- Add validation triggers for main_tag_id

### 3. `20250524000004_tag_historical_data.sql`
**Purpose**: Preserve tag history and audit trails

## Current Issues to Fix

### Issue 1: Missing Database Indexes
**Priority**: Medium
**Impact**: Performance degradation on large datasets

**Required Indexes**:
```sql
-- Performance indexes for new foreign keys
CREATE INDEX idx_referrals_tag_id ON referrals(tag_id);
CREATE INDEX idx_send_accounts_main_tag_id ON send_accounts(main_tag_id);
CREATE INDEX idx_send_account_tags_send_account_id ON send_account_tags(send_account_id);
CREATE INDEX idx_send_account_tags_tag_id ON send_account_tags(tag_id);
```

### Issue 2: Missing Column Drop
**Priority**: Medium
**Impact**: Migration consistency

**Problem**: Migration references dropping `referrals.tag` column that was never actually dropped
**Location**: `supabase/migrations/20250524000005_update_tag_functions.sql:593`

**Fix**: Create cleanup migration to properly drop the column if it exists

### Issue 3: Function Compatibility
**Priority**: Medium
**Impact**: Tag validation broken

**Problem**: `check_tags_allowlist_before_insert_func` still assumes direct user_id relationship
**Fix**: Update function to work with send_account_tags junction table

## Implementation Tasks

### Task 1.1: Create Missing Indexes Migration
```sql
-- File: supabase/migrations/[timestamp]_add_send_account_tags_indexes.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_tag_id 
ON referrals(tag_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_send_accounts_main_tag_id 
ON send_accounts(main_tag_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_send_account_tags_send_account_id 
ON send_account_tags(send_account_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_send_account_tags_tag_id 
ON send_account_tags(tag_id);
```

### Task 1.2: Fix Column Drop Migration
```sql
-- File: supabase/migrations/[timestamp]_cleanup_referrals_tag_column.sql
DO $$ 
BEGIN 
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referrals' AND column_name = 'tag'
  ) THEN
    ALTER TABLE referrals DROP COLUMN tag;
  END IF;
END $$;
```

### Task 1.3: Update Tag Allowlist Function
```sql
-- Update check_tags_allowlist_before_insert_func to work with junction table
CREATE OR REPLACE FUNCTION check_tags_allowlist_before_insert_func()
RETURNS TRIGGER AS $$
BEGIN
  -- Updated logic to check send_account_tags relationship
  -- instead of direct user_id relationship
  IF NOT EXISTS (
    SELECT 1 FROM send_account_tags sat
    JOIN send_accounts sa ON sat.send_account_id = sa.id
    WHERE sat.tag_id = NEW.id 
    AND sa.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Tag not associated with user send account';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Validation Triggers

### Main Tag Validation
Ensure `main_tag_id` always references a confirmed tag owned by the user:

```sql
CREATE OR REPLACE FUNCTION validate_main_tag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.main_tag_id IS NOT NULL THEN
    -- Check tag exists, is confirmed, and belongs to user
    IF NOT EXISTS (
      SELECT 1 FROM send_account_tags sat
      JOIN tags t ON sat.tag_id = t.id
      WHERE sat.send_account_id = NEW.id
      AND t.id = NEW.main_tag_id
      AND t.status = 'confirmed'
    ) THEN
      RAISE EXCEPTION 'Main tag must be a confirmed tag owned by the send account';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_main_tag_trigger
  BEFORE INSERT OR UPDATE ON send_accounts
  FOR EACH ROW EXECUTE FUNCTION validate_main_tag();
```

## Testing

### Database Tests to Run
```bash
cd supabase && yarn supabase test
```

### Key Test Files
- `supabase/tests/send_account_tags_test.sql` - Junction table functionality
- `supabase/tests/tags_confirmation_test.sql` - Updated for tag IDs
- `supabase/tests/tag_referrals_test.sql` - Updated foreign key references

### Validation Checklist
- [ ] All existing tags have numeric IDs
- [ ] Junction table properly populated
- [ ] Main tags set for existing users
- [ ] Foreign key constraints working
- [ ] Indexes created for performance
- [ ] Validation triggers prevent invalid states

## Data Migration Safety

### Backup Strategy
```bash
# Before running migrations
pg_dump -h localhost -p 54322 -U postgres postgres > backup_before_tag_migration.sql
```

### Rollback Plan
- Keep original migration files for reference
- All operations are reversible
- Foreign key constraints prevent data loss
- Junction table can be recreated from existing relationships

## Definition of Done

- [ ] All migration files execute successfully
- [ ] Performance indexes added
- [ ] Validation triggers working
- [ ] All database tests pass
- [ ] No data loss during migration
- [ ] Foreign key relationships intact
- [ ] Function compatibility verified

## Next Phase

After completion, proceed to **Phase 2: API Layer Updates** to fix critical endpoint issues.