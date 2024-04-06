import { test as baseTest } from '@playwright/test'
import { createSeedClient } from '@snaplet/seed'
import { models, type SeedClient } from '@my/snaplet'
import { Client as PgClient } from 'pg'
import { debug, type Debugger } from 'debug'
import { copycat } from '@snaplet/copycat'

let log: Debugger

// biome-ignore lint/complexity/noBannedTypes: playwright needs any type
export const test = baseTest.extend<{}, { seed: SeedClient; pg: PgClient }>({
  seed: [
    async ({ pg }, use) => {
      const key = `test:fixtures:snaplet:${test.info().workerIndex}`
      log = debug(key)

      log('seed')

      const seed = await createSeedClient({
        dryRun: false,
        models,
        client: {
          async query(queryText) {
            try {
              await pg.query('SET session_replication_role = replica') // do not run any triggers
              await pg.query('BEGIN')
              log('query', queryText)
              return await pg
                .query(queryText)
                .then((results) =>
                  pg.query('COMMIT').then(() => {
                    return results
                  })
                )
                .catch(async (e) => {
                  await pg.query('ROLLBACK')
                  throw e
                })
            } finally {
              await pg.query('SET session_replication_role = DEFAULT').catch((e) => {
                log('error resetting session_replication_role', e)
              }) // turn on triggers
            }
          },
        },
      })

      try {
        copycat.setHashKey(key)
        await use(seed)
      } finally {
        // @note we could use seed.$resetDatabase() here, but that deletes **all** data
        // for now, we just delete the users created and leverage foreign key constraints to delete all related data
        for (const user of seed.$store.users) {
          await pg.query('DELETE FROM auth.users WHERE id = $1', [user.id]).catch((e) => {
            log('error deleting user', `user=${user.id}`, e)
            throw e
          })
        }
      }
    },
    { scope: 'worker' },
  ],
  pg: [
    // biome-ignore lint/correctness/noEmptyPattern: playwright/test needs empty pattern
    async ({}, use) => {
      const pg = new PgClient({
        connectionString: process.env.SUPABASE_DB_URL,
        application_name: `playwright_test_${test.info().workerIndex}`,
      })
      await pg.connect()

      try {
        await use(pg)
      } finally {
        await pg.end().catch((e) => {
          log('error closing pg client', e)
        })
      }
    },
    { scope: 'worker' },
  ],
})

export const { expect } = test
