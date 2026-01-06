---
name: supabase-schema
description: Supabase declarative schema workflow. Use when modifying database schemas, creating migrations, or working with PostgreSQL types. Covers the stop-edit-diff-start cycle.
---

# Supabase Declarative Schema

Send uses Supabase's **Declarative Schema** approach. Schemas are defined in `supabase/schemas/` - migrations are generated from schema changes, not written manually.

## Schema Change Workflow

**IMPORTANT:** Always stop the database before modifying schema files.

```bash
# 1. Stop database
cd supabase && yarn stop

# 2. Edit schema files in supabase/schemas/

# 3. Generate migration from changes
cd supabase && yarn migration:diff <migration_name>

# 4. Start database to apply
cd supabase && yarn start
```

## Common Commands

```bash
# Start local Supabase
cd supabase && yarn start

# Reset database (after migration changes)
cd supabase && yarn reset

# Generate TypeScript types
cd supabase && yarn generate

# Run database tests
cd supabase && yarn test
```

## Schema Files

Location: `supabase/schemas/`

Edit these files directly. The CI pipeline includes schema drift detection to ensure migrations stay in sync with declarative schemas.

## After Schema Changes

1. Reset database: `cd supabase && yarn reset`
2. Regenerate types: `cd supabase && yarn generate`
3. Run tests: `cd supabase && yarn test`
