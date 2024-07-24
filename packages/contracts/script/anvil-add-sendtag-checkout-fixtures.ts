import 'zx/globals'
import type { Database } from '@my/supabase/database.types'
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is not set. Please update the root .env.local and restart the server.'
  )
}
if (!process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE is not set. Please update the root .env.local and restart the server.'
  )
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE

/**
 * only meant to be used on the server side.
 */
const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
})

$.verbose = true

/**
 * This script is used to deploy the DeploySendtagCheckout
 */

const RPC_URL = 'http://127.0.0.1:8546'
void (async function main() {
  console.log(chalk.blue('Enable auto-mining...'))
  await $`cast rpc --rpc-url ${RPC_URL} evm_setAutomine true`

  $.env.OWNER = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  $.env.MULTISIG = '0x71fa02bb11e4b119bEDbeeD2f119F62048245301'
  $.env.TOKEN = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

  console.log(
    `${chalk.blue('Deploying DeploySendtagCheckout contract...')}
OWNER=${$.env.OWNER}\t\thttps://basescan.org/address/${$.env.OWNER}
MULTISIG=${$.env.MULTISIG}\t\thttps://basescan.org/address/${$.env.MULTISIG}
TOKEN=${$.env.TOKEN}\t\thttps://basescan.org/address/${$.env.TOKEN}
`
  )
  await $`forge script ./script/DeploySendtagCheckout.s.sol:DeploySendtagCheckoutScript \
              -vvvv \
              --rpc-url ${RPC_URL} \
              --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
              --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
              --broadcast`
    .then(({ stdout }) => stdout.match(/contract SendtagCheckout (0x[a-fA-F0-9]{40})/)?.[1])
    .catch((e) => {
      if (e.toString().includes('EvmError: CreateCollision')) {
        console.log(chalk.yellow('SendtagCheckout already deployed'))
        return
      }
      throw e
    })

  console.log(chalk.blue('Disable auto-mining...'))
  await $`cast rpc --rpc-url ${RPC_URL} evm_setAutomine false`

  console.log(chalk.blue(`Re-enable interval mining... ${$.env.ANVIL_BLOCK_TIME ?? '2'}`))
  await $`cast rpc --rpc-url ${RPC_URL} evm_setIntervalMining ${$.env.ANVIL_BLOCK_TIME ?? '2'}` // mimics Tiltfile default

  console.log(chalk.green('Done!'))
})()
