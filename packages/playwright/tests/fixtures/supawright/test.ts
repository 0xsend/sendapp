import { withSupawright } from 'supawright'
import type { Database } from '@my/supabase/database.types'
import { faker } from '@faker-js/faker'
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
export const test = withSupawright<Database, 'public'>(['public'], {
  generators: {
    // @note This could be better due to https://github.com/isaacharrisholt/supawright/issues/5
    'USER-DEFINED': (table, column) => {
      if (table === 'tags') {
        if (column === 'status') {
          return 'confirmed'
        }
        if (column === 'name') {
          return faker.lorem.word({ length: { min: 2, max: 5 } }) + String(new Date().valueOf())
        }
      }
      if (table === 'send_accounts') {
        if (column === 'address') {
          return privateKeyToAddress(generatePrivateKey())
        }
      }
      console.error(
        `Do not know how to generate ${column} for ${table}. Specifiy a generator in the test file.`
      )
      throw new Error(`unexpected column ${column} in table ${table}`)
    },
  },
})
