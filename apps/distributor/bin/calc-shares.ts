import { parseArgs } from 'node:util'
import { supabaseAdmin } from '../src/supabase'
import 'zx/globals'

if (!$.env.SUPABASE_SERVICE_ROLE) {
  throw new Error('SUPABASE_SERVICE_ROLE is required')
}

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    distributor: {
      type: 'string',
      default: 'http://localhost:3050/distributor',
    },
    distribution: {
      type: 'string',
      default: undefined,
    },
  },
  strict: true,
  allowPositionals: true,
})

if (values.distribution === undefined) {
  const { data, error } = await supabaseAdmin
    .from('distributions')
    .select('*')
    .order('number', { ascending: false })
    .limit(1)
    .single()
  if (error) {
    throw error
  }
  if (!data) {
    throw new Error('No distribution found')
  }
  values.distribution = data.id.toString()
}

const { distributor, distribution } = values

if (distribution === undefined) {
  throw new Error('Distribution not found')
}

if (distributor === undefined) {
  throw new Error('Distributor not found')
}

console.log(chalk.blue('Calculating distribution shares...'), { distributor, distribution })

// send post request to distributor running at localhost:3050
const response = await fetch(distributor, {
  method: 'POST',
  body: JSON.stringify({ id: distribution }),
  headers: {
    'Content-Type': 'application/json',
    Authorization: $.env.SUPABASE_SERVICE_ROLE,
  },
})

// // get the response body
const body = await response.json()
console.log('Done', body)
