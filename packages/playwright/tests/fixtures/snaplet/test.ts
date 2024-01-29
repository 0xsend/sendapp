import { test as baseTest } from '@playwright/test'
import { createSeedClient } from '@snaplet/seed'
import { models } from '@my/snaplet'
import { Client as PgClient } from 'pg'
import { debug, Debugger } from 'debug'

let log: Debugger

type SeedClient = Awaited<ReturnType<typeof createSeedClient>>

export const test = baseTest.extend<{ seed: SeedClient; pg: PgClient }>({
  seed: async ({ pg }, use) => {
    log = debug(`test:fixtures:snaplet:${test.info().workerIndex}`)
    const seed = await createSeedClient({
      dryRun: false,
      models,
    })
    await use(seed)
    // @note we could use seed.$resetDatabase() here, but that deletes **all** data

    // for now, we just delete the users created and leverage foreign key constraints to delete all related data
    for (const user of seed.$store.users) {
      await pg.query(`DELETE FROM auth.users WHERE id = '${user.id}'`)
    }
  },
  // biome-ignore lint/correctness/noEmptyPattern: playwright/test needs empty pattern
  pg: async ({}, use) => {
    const pg = new PgClient({
      connectionString: process.env.SUPABASE_DB_URL,
      application_name: `playwright_test_${test.info().parallelIndex}`,
    })
    await pg.connect()
    // await pg.query('BEGIN') // start transaction
    try {
      await use(pg)
    } finally {
      // await pg.query('ROLLBACK') // rollback transaction
      await pg.end()
    }
  },
})

export const { expect } = test
