# Supabase Schema Migration to Declarative Files

## 🚀 Migration Status: IN PROGRESS

**Completed Migrations:** 12 tables successfully migrated (8 core + 4 distribution tables)
**Last Updated:** January 26, 2025
**Goal:** Complete migration of ALL tables and objects - prod.sql must be completely eliminated

## Task
Migrate the large `prod.sql` file into modularized SQL files based on tables. Each table should have its own dedicated SQL file containing all related database objects.

## 🎯 CRITICAL OBJECTIVE
**prod.sql must be completely eliminated.** Every single object (tables, functions, types, sequences, views, triggers, etc.) must be migrated to appropriate schema files. No objects should remain in prod.sql.

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

8. **`distributions.sql`** - Complete distribution system
   - Type: `verification_type` enum
   - Functions: All 12 distribution-related functions including verification insertions and share updates
   - Sequences: `distributions_id_seq`, `distribution_shares_id_seq`, `distribution_verifications_id_seq`
   - Tables: `public.distributions`, `public.distribution_shares`, `public.distribution_verifications`, `public.distribution_verification_values`, `public.send_slash`
   - All constraints, indexes, foreign keys, and grants

9. **`send_earn.sql`** - Complete Send Earn system ✨ NEW ✨
   - Functions: All 10 send_earn-related functions including activity triggers and referral processing
   - Sequences: `send_earn_create_id_seq`, `send_earn_new_affiliate_id_seq`, `send_earn_deposit_id_seq`, `send_earn_withdraw_id_seq`
   - Tables: `public.send_earn_create`, `public.send_earn_new_affiliate`, `public.send_earn_deposit`, `public.send_earn_withdraw`
   - Views: `public.send_earn_activity`, `public.send_earn_balances`
   - All indexes, triggers, RLS policies, and grants

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
  "./schemas/distributions.sql",
  "./schemas/prod.sql",  # TO BE REMOVED WHEN MIGRATION COMPLETE
  "./schemas/*.sql",
]
```

### 🧹 **Cleanup from prod.sql**

**Major Components Removed:**
- All 8 core tables and their components (challenges, profiles, webauthn_credentials, send_accounts, chain_addresses, tags, referrals)
- Distribution system: verification_type enum, 12 functions, 5 tables, all related objects
- Send Earn system: 10 functions, 4 tables, 2 views, all related objects
- Total removed: 16 tables with all associated functions, sequences, constraints, indexes, and grants

### ✅ **Validation Completed**

- **Migration tests passed** - All schema files apply successfully
- **Database integrity maintained** - No syntax errors or broken references
- **Function dependencies resolved** - Expected notices about removed functions confirm correct cleanup

### 📋 **CRITICAL: Remaining Work to Complete**

**IMPORTANT: prod.sql must be completely eliminated. This is not optional.**

#### **Remaining Tables in prod.sql (30 tables):**

**High Priority - Core System Tables:**
1. **`activity`** - Central activity feed (complex, cross-cutting)
2. **Send Account Group (6 tables):**
   - `send_account_created`
   - `send_account_transfers`
   - `send_account_receives`
   - `send_account_signing_key_added`
   - `send_account_signing_key_removed`
   - `send_account_credentials`

**Medium Priority - Feature Tables:**
3. **Send Earn Group (4 tables):**
   - `send_earn_create`
   - `send_earn_new_affiliate`
   - `send_earn_deposit`
   - `send_earn_withdraw`
4. **Receipts Group (3 tables):**
   - `receipts`
   - `tag_receipts`
   - `sendtag_checkout_receipts`
5. **Sendpot Group (2 tables):**
   - `sendpot_jackpot_runs`
   - `sendpot_user_ticket_purchases`

**Lower Priority - Supporting Tables:**
6. **Token & Financial (4 tables):**
   - `send_token_transfers`
   - `send_token_v0_transfers`
   - `send_revenues_safe_receives`
   - `liquidity_pools`/`send_liquidity_pools`
7. **Other Tables:**
   - `affiliate_stats`
   - `swap_routers`

**Schema-specific Tables:**
8. **Shovel Schema (4 tables):**
   - `shovel.ig_updates`
   - `shovel.integrations`
   - `shovel.task_updates`
   - `shovel.sources`
9. **Temporal Schema (2 tables):**
   - `temporal.send_account_transfers`
   - `temporal.send_earn_deposits`

#### **Other Objects to Migrate:**
- All remaining functions not tied to specific tables
- Views (if any)
- Triggers not associated with migrated tables
- Custom types/enums
- Standalone sequences
- Extension configurations

#### **Final Steps:**
1. Complete all table migrations
2. Migrate all remaining objects
3. Verify prod.sql is empty except for initial setup (extensions, schemas)
4. Remove prod.sql from config.toml
5. Delete prod.sql file

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

## Migration Strategy

### 🎯 **Recommended Migration Order**

1. **Group Related Tables** - Migrate tables that work together as a unit:
   - Send Account ecosystem → `send_accounts_ecosystem.sql`
   - Send Earn system → `send_earn.sql`
   - Receipts system → `receipts.sql`
   - Sendpot system → `sendpot.sql`

2. **Handle Complex Tables** - For tables with many dependencies:
   - Activity table might need its own file or be split by concern
   - Consider creating a `shared_types.sql` for types used across multiple schemas

3. **Schema-Specific Files**:
   - `shovel.sql` for all shovel schema objects
   - `temporal.sql` for all temporal schema objects

### ✅ **Completed**
- ✅ challenges
- ✅ profiles  
- ✅ webauthn_credentials
- ✅ send_accounts
- ✅ chain_addresses
- ✅ tags
- ✅ referrals
- ✅ distributions (with send_slash)

### 📋 **Migration Groups Remaining**

1. **send_accounts_ecosystem.sql** (6 tables)
2. **send_earn.sql** (4 tables)
3. **activity.sql** (1 complex table)
4. **receipts.sql** (3 tables)
5. **sendpot.sql** (2 tables)
6. **send_tokens.sql** (3 tables)
7. **financial.sql** (3 tables)
8. **affiliate_stats.sql** (1 table)
9. **shovel.sql** (4 tables)
10. **temporal.sql** (2 tables)
