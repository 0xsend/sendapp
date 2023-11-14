# Supabase

## Getting Started

Create or obtain a snapshot of your Supabase instance and place it in the `supabase/.snaplet/snapshots` directory.

```shell
export SNAPLET_SOURCE_DATABASE_URL=postgresql://postgres:password@db.404.supabase.co:5432/postgres
npx snaplet snapshot capture
# note the snapshot name
```

Start the local Supabase instance.

```shell
yarn supa start
```

Restore the snapshot. Make sure to replace `<SNAPSHOT_NAME>` with the name of your snapshot. Supabase does not support dropping the database, so you will need to pass `--no-reset` to the restore command.

```shell
npx snaplet snapshot restore --no-reset ./.snaplet/snapshots/<SNAPSHOT_NAME>.snaplet
```

## Setting up Supabase

To go through the supabase setup, CD to the root of the directory and run `yarn setup`.

Here are some guides from the official Supabase documentation:

- [Local Development](https://supabase.com/docs/guides/getting-started/local-development)
- [Managing Environments](https://supabase.com/docs/guides/cli/managing-environments)

NOTE: This template assumes you have a public storage bucket with the name `avatars` - Make sure to create it if it doesn't exist.

After setting it up, you can use the [scripts](#scripts) to manage the common tasks related to Supabase.

## Scripts

NOTE: Scripts starting with underscore (`_`) are not meant to be used directly.

You can also run these scripts from the root by adding `supa` after yarn. So `yarn supa start` or `yarn supa g`.

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
