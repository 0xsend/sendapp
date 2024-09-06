import { SeedPg } from '@snaplet/seed/adapter-pg'
import { defineConfig } from '@snaplet/seed/config'
import { Client } from 'pg'

export default defineConfig({
  adapter: async () => {
    const client = new Client(process.env.SUPABASE_DB_URL)
    await client.connect()
    return new SeedPg(client)
  },
  /**
   * Tables that should be selected when seeding
   */
  select: ['!pgtle.*', 'public.*', 'auth.*', 'shovel.*'],
})
