# Supabase

## Declarative Schema Management

This project uses Supabase's [Declarative Database Schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas) approach. Instead of writing step-by-step migration files, we declare the desired state of our database schema in SQL files located in the `schemas/` directory.

### How It Works

1. **Schema Files**: Database schema is defined in `.sql` files within the `schemas/` directory
2. **Automatic Migrations**: When you modify schema files, Supabase automatically generates migration files
3. **CI/CD Integration**: Schema drift checks ensure consistency between declarative schemas and migrations

### Schema Organization

The schema files are organized by domain and loaded in a specific order defined in `config.toml`:

- `extensions.sql` - PostgreSQL extensions
- `types.sql` - Custom types and enums
- `utilities.sql` - Utility functions
- Core tables (profiles, tags, accounts, etc.)
- Activity system tables
- Views in `views/` subdirectory

## Getting Started

Create or obtain a snapshot of your Supabase instance and place it in the `supabase/.snaplet/snapshots` directory.

```shell
export SNAPLET_SOURCE_DATABASE_URL=postgresql://postgres:password@db.404.supabase.co:5432/postgres
npx snaplet snapshot capture
# note the snapshot name
```

Start the local Supabase instance.

```shell
yarn supabase start
```

Restore the snapshot. Make sure to replace `<SNAPSHOT_NAME>` with the name of your snapshot. Supabase does not support dropping the database, so you will need to pass `--no-reset` to the restore command.

```shell
npx snaplet snapshot restore --no-reset ./.snaplet/snapshots/<SNAPSHOT_NAME>.snaplet
```

## Working with Declarative Schemas

### Making Schema Changes

1. **Stop the local database** before making changes:
   ```shell
   yarn supabase stop
   ```

2. **Modify the appropriate schema file** in `supabase/schemas/`

3. **Generate a migration** from your changes:
   ```shell
   yarn migration:diff <MIGRATION_NAME>
   ```

4. **Start the database and apply migrations**:
   ```shell
   yarn supabase start
   ```

### Best Practices

- **Append new columns** to the end of CREATE TABLE statements
- **Review generated migrations** carefully before committing
- **Use descriptive migration names** that explain the change
- **Test locally** before pushing changes

### Schema Drift Detection

The CI pipeline includes automatic schema drift detection that:
- Compares the current database state with declarative schemas
- Fails if there are uncommitted changes
- Ensures migrations stay in sync with schema files

## Setting up Supabase

Here are some guides from the official Supabase documentation:

- [Local Development](https://supabase.com/docs/guides/getting-started/local-development)
- [Managing Environments](https://supabase.com/docs/guides/cli/managing-environments)
- [Declarative Database Schemas](https://supabase.com/docs/guides/local-development/declarative-database-schemas)

NOTE: This template assumes you have a public storage bucket with the name `avatars` - Make sure to create it if it doesn't exist.

After setting it up, you can use the [scripts](#scripts) to manage the common tasks related to Supabase.

## Scripts

NOTE: Scripts starting with underscore (`_`) are not meant to be used directly.

You can also run these scripts from the root by adding `supabase` after yarn. So `yarn supabase start` or `yarn supabase g`.

### Link Project

Links your remote Supabase project. Set `NEXT_PUBLIC_SUPABASE_PROJECT_ID` in your `.env` to your Supabaes instance before running.

```shell
yarn link-project
```

#### Generate

Generates types from your local Docker Supabase instance.

```shell
yarn generate
yarn g #alias
```

- [Reference](https://supabase.com/docs/guides/api/rest/generating-types)

#### Generate Remote

Generates types from your remote Supabase instance using your project ID specifid in the root env files.

```shell
yarn generate:remote
```

#### New Migration

Generates a new migration by diffing against the db.

```shell
yarn migration:diff <MIGRATION_NAME>
```

##### Snaplet Restore

Since the snaplet snapshots won't have knowledge of the new columns, if you need to restore a snapshot, extra steps are required. A demonstrative example is below:

```shell
git commit -am 'wip' # save the migration i'm working on
rm ./supabase/path_the_new_migration.sql
bunx supabase db reset
bunx snaplet snapshot restore --no-reset my-snapshot
git checkout ./supabase/path_the_new_migration.sql
bunx supabase migration up
```

- [Reference](https://supabase.com/docs/reference/cli/supabase-db-diff)

#### Start

Start local Supabase instance.

```shell
yarn start
```

#### Stop

Stop local Supabase instance.

```shell
yarn stop
```

#### Reset

Reset local Supabase DB.

```shell
yarn reset
```

#### Lint

```shell
yarn lint
```
