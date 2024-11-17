import 'zx/globals'
import * as pg from 'pg'

const argv = minimist(process.argv.slice(2), {
  boolean: ['help', 'restore', 'seed', 'verbose', 'onboard-users'],
})

if (argv.help) {
  console.log(`
    Usage: snaplet [options]

    Options:
      --seed      Seed the database with default data
      --restore   Restore the database from a snapshot
      --onboard-users  Onboard users with send accounts by copying from chain_addresses into send_accounts

  `)
  process.exit(0)
}

if (argv.verbose) {
  $.verbose = true
}

if (argv.seed) {
  import('./seed')
  process.exit(0)
}

if (argv.restore) {
  const prjRoot = await $`git rev-parse --show-toplevel`
    .catch((e) => {
      console.log(chalk.red('Error getting project root:'), e)
      process.exit(1)
    })
    .then((r) => r.stdout.trim())
  console.log(chalk.blue('Restoring database from snapshot'))
  // remove any migrations that are not in production yet
  const migs = await $`git diff --exit-code -- ${prjRoot}/supabase/migrations` // ensure we don't have any uncommitted migrations
    .catch((e) => {
      console.log(
        chalk.red('Refusing to restore database from snapshot with uncommitted migrations:')
      )
      console.log(e.stdout)
      process.exit(1)
    })
    .then(
      () =>
        $`git diff --name-only --diff-filter=A origin/main..HEAD -- ${prjRoot}/supabase/migrations`
    )
    .catch((e) => {
      console.log(chalk.red('Error getting migrations:'), e)
      process.exit(1)
    })
    .then((r) =>
      r.stdout
        .trim()
        .split('\n')
        .map((s) => `${prjRoot}/${s}`)
        .filter((s) => s.endsWith('.sql'))
    )
  const rmMigs = migs.length > 0
  if (rmMigs) {
    console.log(chalk.blue('Removing migrations...', migs))
    await $`rm -f ${migs}`.catch((e) => {
      console.log(chalk.red('Error removing migrations:'), e)
      process.exit(1)
    })
  }

  // now run the snapshot restore command
  await $`bunx supabase db reset`.catch((e) => {
    console.log(chalk.red('Error resetting database:'), e)
    process.exit(1)
  })
  // restore the database from the latest snapshot
  await $`env SNAPLET_TARGET_DATABASE_URL=$SUPABASE_DB_URL bunx @snaplet/snapshot snapshot restore --no-reset --latest`.catch(
    (e) => {
      console.log(chalk.red('Error restoring database:'), e.stderr)
      process.exit(1)
    }
  )
  console.log(chalk.green('Done restoring database'))
  if (rmMigs) {
    // now migrate the database with the latest migrations
    console.log(chalk.blue('Migrating database after restoring snapshot...'))
    await $`git checkout ${prjRoot}/supabase/migrations`.catch((e) => {
      console.log(chalk.red('Error checking out migrations:'), e)
      process.exit(1)
    })
    await $`bunx supabase db push --local --include-all`.catch((e) => {
      console.log(chalk.red('Error migrating database:'), e)
      process.exit(1)
    })
    console.log(chalk.green('Done migrating database'))
    process.exit(0)
  }
  console.log(chalk.green('Done restoring database'))
  process.exit(0)
}

if (argv.onboardUsers) {
  // @ts-expect-error typescript is confused
  const { Client: PgClient } = pg.default as unknown as typeof pg

  const pgClient = new PgClient({
    connectionString: process.env.SUPABASE_DB_URL,
    application_name: 'snaplet',
  })
  await pgClient.connect()
  // pretend everyone onboarded with send accounts
  await pgClient
    .query(`--sql
insert into send_accounts (user_id, address, chain_id, init_code)
select
    u.id as user_id,
    c.address,
    '845337' as chain_id,
    CONCAT(
        '\\x00',
        UPPER(
            CONCAT(
                MD5(RANDOM()::text), MD5(RANDOM()::text), MD5(RANDOM()::text), MD5(RANDOM()::text)
            )
        )
    )::bytea as init_code
from auth.users as u
inner join chain_addresses as c on u.id = c.user_id
where user_id not in (select user_id from send_accounts);
`)
    .then(() => {
      return false
    })
    .catch((e) => {
      console.log(chalk.red('Error inserting onboarded users:'), e)
      return true
    })
    .then(async (err) => {
      await pgClient.end()
      if (err) {
        process.exit(1)
      }
    })
  process.exit(0)
}

console.log('Unknown command', argv._)
process.exit(1)
