import { test as baseTest } from '@playwright/test'
import { createSeedClient } from '@snaplet/seed'
import { models } from '@my/snaplet'
import { Client as PgClient } from 'pg'
import { debug, Debugger } from 'debug'
import { copycat } from '@snaplet/copycat'

let log: Debugger

type SeedClient = Awaited<ReturnType<typeof createSeedClient>>

export const test = baseTest.extend<{ seed: SeedClient; pg: PgClient }>({
  seed: async ({ pg }, use) => {
    const key = `test:fixtures:snaplet:${test.info().workerIndex}`
    log = debug(key)

    log('seed')

    copycat.setHashKey(copycat.generateHashKey(key))

    const seed = await createSeedClient({
      dryRun: false,
      models,
      client: pg,
    })

    await pg.query('SET session_replication_role = replica;') // do not run any triggers

    await use(seed)

    // @note we could use seed.$resetDatabase() here, but that deletes **all** data
    // for now, we just delete the users created and leverage foreign key constraints to delete all related data
    await pg.query('SET session_replication_role = DEFAULT;') // turn on triggers
    for (const user of seed.$store.users) {
      await pg.query('DELETE FROM auth.users WHERE id = $1', [user.id])
    }
  },
  // biome-ignore lint/correctness/noEmptyPattern: playwright/test needs empty pattern
  pg: async ({}, use) => {
    const pg = new PgClient({
      connectionString: process.env.SUPABASE_DB_URL,
      application_name: `playwright_test_${test.info().parallelIndex}`,
    })
    await pg.connect()

    try {
      await use(pg)
    } finally {
      await pg.end()
    }
  },
})

export const { expect } = test
