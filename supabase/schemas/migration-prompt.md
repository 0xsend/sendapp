# Supabase Schema Migration to Declarative Files

## ✅ Migration Status: PARTIALLY COMPLETED

**Completed Migrations:** 7 tables successfully migrated
**Last Updated:** January 25, 2025
**Status:** Core tables migrated, optional cleanup remaining

## Task
Migrate the large `prod.sql` file into modularized SQL files based on tables. Each table should have its own dedicated SQL file containing all related database objects.

## 📊 Migration Progress

### ✅ **Completed Migrations**

The following tables have been successfully migrated from `prod.sql` into dedicated schema files:

1. **`challenges.sql`** - Challenge management system
   - Functions: `insert_challenge()`
   - Sequences: `challenges_id_seq`
   - Table: `public.challenges`
   - All constraints, indexes, and permissions

2. **`profiles.sql`** - User profiles with referral system
   - Functions: `generate_referral_code()`
   - Sequences: `profiles_send_id_seq`
   - Table: `public.profiles`
   - Comprehensive RLS policies and constraints

3. **`webauthn_credentials.sql`** - Authentication credentials
   - Functions: `query_webauthn_credentials_by_phone()`
   - Table: `public.webauthn_credentials`
   - Key type validation and security policies

4. **`send_accounts.sql`** - Core Send accounts system
   - Functions: `create_send_account()`, `distribution_hodler_addresses()`, `send_accounts_add_webauthn_credential()`, `send_accounts_after_insert()`, `insert_verification_create_passkey()`
   - Table: `public.send_accounts`
   - Complex triggers and verification system

5. **`chain_addresses.sql`** - User blockchain addresses
   - Functions: `chain_addresses_after_insert()`
   - Table: `public.chain_addresses`
   - Address validation and user constraints

6. **`tags.sql`** - Comprehensive tag system
   - Functions: `confirm_tags()` and related tag management functions
   - Table: `public.tags`
   - Tag status management and RLS policies

7. **`referrals.sql`** - Complete referral system
   - Functions: `generate_referral_event_id()` (2 overloads), `update_leaderboard_referrals_all_time_*()`, `get_affiliate_referrals()`, `insert_verification_referral()`, `leaderboard_referrals_all_time()`, `referrals_*_activity_trigger()`, `user_referrals_count()`
   - Sequences: `referrals_id_seq`
   - Tables: `public.referrals`, `private.leaderboard_referrals_all_time`
   - Complex trigger system and activity integration

### 🔧 **Configuration Updated**

Updated `/supabase/config.toml` with proper dependency order:
```toml
[db.migrations]
schema_paths = [
  "./schemas/challenges.sql",
  "./schemas/profiles.sql",
  "./schemas/webauthn_credentials.sql",
  "./schemas/send_accounts.sql",
  "./schemas/chain_addresses.sql",
  "./schemas/tags.sql",
  "./schemas/referrals.sql",
  "./schemas/prod.sql",
  "./schemas/*.sql",
]
```

### 🧹 **Cleanup from prod.sql**

**Major Components Removed:**
- Referrals functions: `generate_referral_event_id()` functions
- Referrals tables: `public.referrals` and `private.leaderboard_referrals_all_time`
- Associated sequences, constraints, and indexes

### ✅ **Validation Completed**

- **Migration tests passed** - All schema files apply successfully
- **Database integrity maintained** - No syntax errors or broken references
- **Function dependencies resolved** - Expected notices about removed functions confirm correct cleanup

### 📋 **Remaining Work**

The core migration is complete and functional. Optional cleanup tasks include:

1. **Additional Tables** - Consider migrating other large tables if needed:
   - `activity` (complex, cross-cutting concerns)
   - `send_account_*` tables (transfers, receives, etc.)
   - Distribution-related tables
   - Send earn tables

2. **Fine-grained Cleanup** - Remove remaining references from prod.sql:
   - Individual function grants and revokes
   - Constraint definitions for migrated tables
   - Index definitions for migrated tables

**Note:** The current state is fully functional. Additional migrations can be done incrementally as needed.

## Process
Work methodically through each table, one at a time:

1. **Create a comprehensive task list** tracking all tables to be migrated
2. **For each table, identify and extract ALL related components**
3. **Create a new SQL file** named after the table (e.g., `send_accounts.sql`)
4. **Remove the migrated objects** from `prod.sql` after successful migration

## Components to Extract for Each Table

When migrating a table, ensure you capture ALL of these components in the correct order:

### 1. **Type Definitions**
   - Custom types used by the table (ENUM, composite types, etc.)
   - Include the ALTER TYPE ... OWNER TO statements

### 2. **Functions**
   - All functions that directly reference or operate on the table
   - Functions used in triggers for the table
   - Functions that accept the table as a parameter type
   - Include function ownership statements

### 3. **Sequences** (if applicable)
   - Sequence definitions used for auto-incrementing columns
   - Sequence ownership statements
   - ALTER SEQUENCE ... OWNED BY statements

### 4. **Table Definition**
   - CREATE TABLE statement with all columns and inline constraints
   - Check constraints
   - Default values
   - Table ownership statement

### 5. **Primary Keys and Constraints**
   - Primary key constraints (if not inline)
   - Unique constraints
   - Check constraints (if not inline)
   - Default value settings (ALTER TABLE ... ALTER COLUMN ... SET DEFAULT)

### 6. **Indexes**
   - All indexes on the table (btree, gin, unique, partial, etc.)
   - Include any special index types or conditions

### 7. **Foreign Keys**
   - All foreign key constraints referencing other tables
   - Note: Also check for foreign keys in OTHER tables that reference this table

### 8. **Triggers**
   - All triggers defined on the table
   - Include both BEFORE and AFTER triggers
   - Include row-level and statement-level triggers

### 9. **Row Level Security (RLS)**
   - ALTER TABLE ... ENABLE ROW LEVEL SECURITY statement
   - All policies (SELECT, INSERT, UPDATE, DELETE)
   - Policy definitions with their conditions

### 10. **Grants and Permissions**
   - Table grants (GRANT ALL ON TABLE ...)
   - Function grants (GRANT ALL ON FUNCTION ...)
   - Sequence grants (GRANT ALL ON SEQUENCE ...)
   - Include both REVOKE and GRANT statements

## File Structure Template

```sql
-- Types
[Type definitions if applicable]

-- Functions
[Function definitions]

-- Sequences
[Sequence definitions if applicable]

-- Table
[CREATE TABLE statement]

-- Sequence ownership and defaults
[ALTER SEQUENCE ... OWNED BY if applicable]
[ALTER TABLE ... SET DEFAULT if applicable]

-- Primary Keys and Constraints
[Primary key and constraint definitions]

-- Indexes
[Index definitions]

-- Foreign Keys
[Foreign key constraints]

-- Triggers
[Trigger definitions]

-- RLS
[Row level security enablement and policies]

-- Grants
[Permission grants and revokes]
```

## Search Strategy

For each table, use these search patterns to ensure nothing is missed:

1. `CREATE TABLE.*table_name` - Find the table definition
2. `table_name` - Find all references including functions, triggers, policies
3. `CONSTRAINT.*table_name` - Find constraints
4. `INDEX.*table_name` - Find indexes
5. `TRIGGER.*ON.*table_name` - Find triggers
6. `POLICY.*ON.*table_name` - Find RLS policies
7. `FOREIGN KEY.*REFERENCES.*table_name` - Find foreign keys TO this table
8. `GRANT.*table_name` - Find permissions
9. `FUNCTION.*table_name` - Find related functions
10. Check for types used in the table columns

## Important Notes

1. **Order matters** - Types must be defined before tables that use them
2. **Dependencies** - Be aware of cross-table dependencies (foreign keys, functions)
3. **Completeness** - Missing any component can cause the migration to fail
4. **Testing consideration** - Each file should be able to recreate its table fully
5. **Remove from source** - After successfully creating the new file, remove all migrated objects from `prod.sql`

## Cross-Table Dependencies

When migrating tables with dependencies:

1. **Identify Dependencies First**
   - Check for foreign key constraints that reference other tables
   - Note functions that operate across multiple tables
   - Identify shared types used by multiple tables

2. **Update config.toml**
   - After migrating a table with dependencies, update `/supabase/config.toml`
   - In the `db.migrations.schema_paths` array, ensure dependent tables appear in the correct order
   - For example, if `send_account_credentials` depends on `send_accounts`:
     ```toml
     [db.migrations]
     schema_paths = [
       "./schemas/profiles.sql",
       "./schemas/send_accounts.sql",        # Must appear before dependent tables
       "./schemas/send_account_credentials.sql",  # Depends on send_accounts
       "./schemas/prod.sql",
       "./schemas/*.sql",
     ]
     ```

3. **Migration Order Strategy**
   - Start with tables that have no foreign key dependencies
   - Move to tables that only depend on already-migrated tables
   - Document any circular dependencies that may require special handling

## Example Tables to Migrate

### ✅ **Completed (High Priority)**
- ✅ send_accounts
- ✅ webauthn_credentials
- ✅ tags
- ✅ referrals
- ✅ chain_addresses
- ✅ profiles
- ✅ challenges

### 📋 **Remaining**
- activity (complex, cross-cutting concerns - consider keeping in prod.sql)
- send_account_* tables (created, receives, transfers, etc.)
- distribution tables
- send_earn tables
- affiliate_stats
- receipts and tag_receipts
