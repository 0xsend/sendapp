# snaplet

Snaplet is used for seeding our local development environment with production-like data. It is used both as a CLI tool and as a typescript library.

It seeds our database using two main methods:

## Seeding

[`seed.ts`](./seed.ts): This resets the database and seeds it with a set of default data. It is used to seed the database for local development esepcially for data that is not available in the production database.

## Restoring from snapshot

`bunx snaplet snapshot restore --no-reset`: This restores the database from a snapshot hosted in snaplet's cloud storage. It is used to restore the database for local development and restores production-like data. This is useful for testing and debugging.

**⚠️ When restoring from snapshot** migrations are not run and can make your local database inconsistent with the production database or even fail to restore some data. To mitigate this, remove any migrations that are not in production yet. See below for how to remove migrations to overcome this.

```shell
# Meant to be run from the root of the project, you may need to remove other migrations. 
# This is just an example.
rm -f ./supabase/migrations/20240107035807_users_can_have_only_one_send_account.sql
rm -f ./supabase/migrations/20240101173854_create_webauthn_credentials.sql
rm -f ./supabase/migrations/20240102033418_create_send_accounts.sql
rm -f ./supabase/migrations/20240229220531_add_shovel.sql
rm -f ./supabase/migrations/20240229220532_add_shovel_integrations.sql
rm -f ./supabase/migrations/20240302022726_insert_distribution_four.sql
rm -f ./supabase/migrations/20240302022727_update_distribution_hodler_function.sql
rm -f ./supabase/migrations/20240113035231_users_referrals_count.sql
rm -f ./supabase/migrations/20240116215010_create_tag_search_function.sql
rm -f ./supabase/migrations/20240122020348_create_profile_lookup_function.sql
rm -f ./supabase/migrations/20240129215957_update_tags_before_insert_or_update_func.sql

# now run the snapshot restore command
bunx supabase db reset && \
bunx snaplet snapshot restore --no-reset --latest && \
git checkout ./supabase/migrations && \
bunx supabase db push --local --include-all
```

## Capturing snapshots

`bunx snaplet snapshot capture`: This captures a snapshot of the database and saves it locally. It can then be shared with other developers by uploading the snapshot to snaplet's cloud storage.

**⚠️ Capturing snapshots** requires access to the production database.

```shell
export SNAPLET_SOURCE_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
bunx snaplet snapshot capture
bunx snaplet snapshot share <snapshot-id>
```
