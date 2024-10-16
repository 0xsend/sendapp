# snaplet

Snaplet is used for seeding our local development environment with production-like data. It is used both as a CLI tool and as a typescript library.

It seeds our database using two main methods:

## Seeding

[`seed.ts`](./seed.ts): This resets the database and seeds it with a set of default data. It is used to seed the database for local development esepcially for data that is not available in the production database.

## Capturing snapshots

`bunx @snaplet/snapshot snapshot capture`: This captures a snapshot of the database and saves it locally. It can then be shared with other developers by uploading the snapshot to snaplet's cloud storage.

**⚠️ Capturing snapshots** requires access to the production database.

```shell
# set to production database url
export SNAPLET_SOURCE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
bunx @snaplet/snapshot snapshot capture
```

## Restoring from snapshot

`bunx @snaplet/snapshot snapshot restore --no-reset`: This restores the database from a snapshot hosted in snaplet's cloud storage. It is used to restore the database for local development and restores production-like data. This is useful for testing and debugging.

**⚠️ When restoring from snapshot** migrations are not run and can make your local database inconsistent with the production database or even fail to restore some data. To mitigate this, remove any migrations that are not in production yet. See below for how to remove migrations to overcome this.

### Removing migrations

This step is required in case the snapshots and migrations conflict since the snapshots are created from the production database without your feature branch's migrations. To remove migrations that are not in production yet, run the following command:

```shell
# when you are ready to remove the migrations
git diff --name-only --diff-filter=A origin/main..HEAD -- supabase/migrations  | xargs rm
```

### Restore

```shell
# set target database url to local development database
export SNAPLET_TARGET_DATABASE_URL=$SUPABASE_DB_URL
# now run the snapshot restore command
bunx supabase db reset && \
bunx @snaplet/snapshot snapshot restore --no-reset --latest && \
git checkout ./supabase/migrations && \
bunx supabase db push --local --include-all
psql $SUPABASE_DB_URL -c "insert into send_accounts (user_id, address, chain_id, init_code) select u.id as user_id, c.address, '845337' as chain_id, CONCAT( '\\x00', upper( CONCAT( md5(random() :: text), md5(random() :: text), md5(random() :: text), md5(random() :: text) ) ) ) :: bytea as init_code from auth.users u join chain_addresses c on c.user_id = u.id where user_id not in ( select user_id from send_accounts );"
```
