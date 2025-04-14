import { models, userOnboarded, type SeedClient } from '@my/snaplet'
import { test as baseTest } from '@playwright/test'
import { copycat } from '@snaplet/copycat'
import { createSeedClient } from '@snaplet/seed'
import type { SeedPostgres } from '@snaplet/seed/adapter-postgres'
import { assert } from 'app/utils/assert'
import debug from 'debug'
import pg from 'pg'

let log: debug.Debugger

export const test = baseTest.extend<{ referrer: Referrer }, { seed: SeedClient; pg: pg.Client }>({
  seed: [
    async ({ pg }, use) => {
      const key = `test:fixtures:snaplet:${test.info().workerIndex}`
      log = debug(key)

      log('seed')

      const adapter: SeedPostgres = {
        execute: async (queryText) => {
          log('execute', queryText)
          await pg.query('SET session_replication_role = replica') // do not run any triggers
          await pg.query('BEGIN')
          await pg
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
            .finally(async () => {
              await pg.query('SET session_replication_role = DEFAULT').catch((e) => {
                log('error resetting session_replication_role', e)
              }) // turn on triggers
            })
        },

        async query(queryText) {
          try {
            await pg.query('SET session_replication_role = replica') // do not run any triggers
            await pg.query('BEGIN')
            log('query', queryText)
            return await pg
              .query(queryText)
              .then((results) =>
                pg.query('COMMIT').then(() => {
                  const { rows } = results
                  return rows
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

        client: pg,
      }

      const seed = await createSeedClient({
        dryRun: false,
        models,
        adapter,
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
      const conn = new pg.Client({
        connectionString: process.env.SUPABASE_DB_URL,
        application_name: `playwright_test_${test.info().workerIndex}`,
      })
      await conn.connect()

      try {
        await use(conn)
      } finally {
        await conn.end().catch((e) => {
          log('error closing pg client', e)
        })
      }
    },
    { scope: 'worker' },
  ],
  referrer: async ({ seed }, use) => use(await setupReferrer(seed)),
})

export const { expect } = test

type Referrer = {
  referrer: { referral_code: string; send_id: number; id: string }
  referrerSendAccount: { address: `0x${string}` }
  referrerTags: string[]
}

/**
 * Sets up a referrer user with a valid referral code and send account
 */
export const setupReferrer = async (seed: SeedClient): Promise<Referrer> => {
  const plan = await seed.users([userOnboarded])
  const referrer = plan.profiles[0]
  const referrerSendAccount = plan.send_accounts[0] as { address: `0x${string}` }
  const referrerTags = plan.tags.map((t) => t.name)
  assert(!!referrer, 'profile not found')
  assert(!!referrer.referral_code, 'referral code not found')
  assert(!!referrerSendAccount, 'referrer send account not found')
  return { referrer, referrerSendAccount, referrerTags } as {
    referrer: { referral_code: string; send_id: number; id: string }
    referrerSendAccount: { address: `0x${string}` }
    referrerTags: string[]
  }
}
