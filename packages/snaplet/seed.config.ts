import { SeedPg } from '@snaplet/seed/adapter-pg'
import { defineConfig } from '@snaplet/seed/config'
import { Client } from 'pg'

/**
 * Tables that should be selected when seeding
 */
export const select = [
  'public.*',
  'shovel.*',
  '!pgtle.*',
  '!auth.*',
  '!realtime.*',
  '!_realtime.*',
  '!*.migrations',
  '!*.schema_migrations',
  'auth.users',
]

export default defineConfig({
  adapter: async () => {
    const client = new Client({
      connectionString: process.env.SUPABASE_DB_URL,
      application_name: 'snaplet',
    })
    await client.connect()
    await client.query('SET session_replication_role = replica;') // do not run any triggers

    return new SeedPg(client)
  },

  select,
})
