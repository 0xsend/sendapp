# Supabase Schema Migration to Declarative Files

## Task
Migrate the large `prod.sql` file into modularized SQL files based on tables. Each table should have its own dedicated SQL file containing all related database objects.

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

High priority tables identified:
- send_accounts
- webauthn_credentials  
- tags
- referrals
- activity
- chain_addresses
- send_account_* tables (created, receives, transfers, etc.)
- distribution tables
- send_earn tables

Start with one table at a time and ensure complete migration before moving to the next.