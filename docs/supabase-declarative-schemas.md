# Supabase Declarative Schemas

## Overview

This project uses Supabase's [Declarative Database Schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas) feature to manage database schema changes. This approach allows developers to declare the desired state of the database schema rather than writing step-by-step migration instructions.

## Benefits

1. **Developer-Friendly**: Write schemas in a natural, declarative way
2. **Version Control**: Schema files are easily tracked in Git
3. **Automatic Migration Generation**: Supabase generates migrations based on schema differences
4. **CI/CD Integration**: Schema drift detection prevents inconsistencies

## Project Structure

```
supabase/
├── config.toml          # Defines schema file loading order
├── schemas/             # Declarative schema files
│   ├── extensions.sql   # PostgreSQL extensions
│   ├── types.sql        # Custom types and enums
│   ├── utilities.sql    # Utility functions
│   ├── profiles.sql     # User profiles table
│   ├── tags.sql         # Tags table
│   ├── activity.sql     # Activity tracking
│   ├── views/           # Database views
│   │   ├── dashboard_metrics.sql
│   │   └── top_senders.sql
│   └── ...              # Other domain-specific schemas
└── migrations/          # Auto-generated migration files
```

## Schema File Organization

Schema files are loaded in a specific order defined in `config.toml`:

```toml
[db.migrations]
schema_paths = [
  "./schemas/extensions.sql",      # Extensions first
  "./schemas/types.sql",           # Custom types
  "./schemas/utilities.sql",       # Utility functions
  "./schemas/profiles.sql",        # Core tables
  # ... other tables in dependency order
  "./schemas/views/*.sql",         # Views last
]
```

## Workflow

### Making Schema Changes

1. **Stop the local database**:
   ```bash
   cd supabase && yarn supabase stop
   ```

2. **Modify the appropriate schema file** in `supabase/schemas/`:
   ```sql
   -- Example: Adding a column to profiles.sql
   CREATE TABLE IF NOT EXISTS profiles (
     id uuid PRIMARY KEY,
     username text,
     created_at timestamptz DEFAULT now(),
     -- Add new column at the end
     avatar_url text
   );
   ```

3. **Generate a migration**:
   ```bash
   cd supabase && yarn migration:diff add_avatar_url_to_profiles
   ```

4. **Review the generated migration** in `supabase/migrations/`

5. **Start the database to apply changes**:
   ```bash
   cd supabase && yarn supabase start
   ```

### Best Practices

1. **Append New Columns**: Always add new columns at the end of CREATE TABLE statements
2. **Review Generated Migrations**: Check that the generated SQL matches your intentions
3. **Test Locally**: Verify changes work as expected before committing
4. **Descriptive Names**: Use clear migration names that describe the change
5. **One Change Per Migration**: Keep migrations focused on a single logical change

## CI/CD Integration

### Schema Drift Detection

The CI pipeline includes a schema drift check that:

1. Starts a fresh Supabase instance
2. Applies all migrations
3. Compares the resulting schema with declarative schema files
4. Fails if there are differences

This is implemented in `.github/actions/supabase-schema-drift-check/action.yml`:

```yaml
- name: Check for Schema Drift
  run: supabase db diff -f changes
- name: Ensure Declarative Schema is Up to Date
  run: |
    git diff --exit-code
    # Check for untracked migration files
    if [ -n "$(git ls-files --others --exclude-standard supabase/migrations/)" ]; then
      echo "Error: Untracked migration files detected"
      exit 1
    fi
```

## Common Scenarios

### Adding a New Table

1. Create a new schema file (e.g., `supabase/schemas/new_feature.sql`)
2. Add the file to `schema_paths` in `config.toml`
3. Define your table structure
4. Generate and apply the migration

### Modifying an Existing Table

1. Find the relevant schema file
2. Make your changes (add columns, modify constraints, etc.)
3. Generate and apply the migration

### Adding Indexes or Constraints

1. Add them to the relevant schema file after the table definition
2. Generate and apply the migration

## Limitations

Declarative schemas do not capture:

- Data manipulation statements (INSERT, UPDATE, DELETE)
- View ownership details
- Some complex RLS policy changes
- Certain advanced PostgreSQL features

For these cases, you may need to write manual migrations.

## Troubleshooting

### Schema Drift in CI

If CI fails with schema drift:

1. Pull the latest changes
2. Reset your local database: `yarn supabase reset`
3. Make your schema changes
4. Generate the migration
5. Commit both the schema changes and generated migration

### Migration Conflicts

If you encounter migration conflicts:

1. Reset your local database
2. Pull the latest migrations
3. Reapply your schema changes
4. Generate a new migration with a later timestamp

## References

- [Supabase Declarative Schemas Documentation](https://supabase.com/docs/guides/local-development/declarative-database-schemas)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli/introduction)
- [PostgreSQL Schema Documentation](https://www.postgresql.org/docs/current/ddl-schemas.html)