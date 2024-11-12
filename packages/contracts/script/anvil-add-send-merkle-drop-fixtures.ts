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
 * This script is used to deploy the SendMerkleDrop contract and add a tranche to the airdrop. It should be adapted as things are deployed to mainnet.
 */

const AIRDROP_MULTISIG_SAFE = '0xD3DCFf1823714a4399AD2927A3800686D4CEB53A'

void (async function main() {
  console.log(chalk.blue('Enable auto-mining...'))
  await $`cast rpc --rpc-url http://localhost:8546 evm_setAutomine true`

  console.log(chalk.blue('Update all chain ids to use local...'))
  console.log(chalk.blue('base mainnet -> base local'))
  const { error } = await supabaseAdmin
    .from('distributions')
    .update({ chain_id: 845337 })
    .filter('chain_id', 'eq', 8453)
  if (error) {
    console.log('error updating chain_id', error)
    throw error
  }
  console.log(chalk.blue('eth mainnet -> eth local'))
  const { error: error2 } = await supabaseAdmin
    .from('distributions')
    .update({ chain_id: 1337 })
    .filter('chain_id', 'eq', 1)
  if (error2) {
    console.log('error updating chain_id', error2)
    throw error2
  }

  // parse merkle drop address from broadcast folder
  const broadcast = JSON.parse(
    await Bun.file(
      `${import.meta.dir}/../broadcast/DeploySendMerkleDrop.s.sol/8453/run-latest.json`
    ).text()
  ) as {
    transactions: {
      contractAddress: string
    }[]
  }
  const merkleDropAddress = broadcast.transactions[0]?.contractAddress // should be the first transaction
  console.log(chalk.blue(`Merkle drop address: ${merkleDropAddress}`))

  console.log(chalk.blue('Get latest distribution id from API'))
  const { data: distribution, error: distributionError } = await supabaseAdmin
    .from('distributions')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single()

  if (distributionError) {
    throw distributionError
  }

  console.log(chalk.red('TODO(@0xBigBoss) move this to the trpc API'))
  process.exit(1)
  return

  // console.log(chalk.blue('Geting distribution merkle root from API'))
  // const { root, total } = await fetch('http://localhost:3050/distributor/merkle', {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`,
  //   },
  //   body: JSON.stringify({ id: distribution?.id }),
  // }).then(async (res) => (res.ok ? res.json() : Promise.reject(await res.text())))

  // $.env.MERKLE_ROOT = root
  // $.env.AMOUNT = total
  // $.env.SEND_MERKLE_DROP_ADDRESS = merkleDropAddress

  // console.log(chalk.blue('Sending 10 ether to the airdrop multisig...'))
  // await $`cast send --rpc-url http://localhost:8546 \
  //           --unlocked \
  //           --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  //           ${AIRDROP_MULTISIG_SAFE} \
  //           --value 10ether`

  // console.log(chalk.blue('Impersonating the airdrop multisig...'))
  // await $`cast rpc --rpc-url http://localhost:8546 \
  //   anvil_impersonateAccount \
  //   ${AIRDROP_MULTISIG_SAFE}`

  // console.log(chalk.blue('Adding a tranche to the airdrop...'))
  // await $`forge script ./script/CreateSendDistributionTranche.s.sol:CreateSendDistributionTrancheScript \
  //             -vvvv \
  //             --fork-url http://localhost:8546 \
  //             --unlocked \
  //             --sender ${AIRDROP_MULTISIG_SAFE} \
  //             --broadcast`

  // console.log(chalk.blue('Stop impersonating the airdrop multisig...'))
  // await $`cast rpc --rpc-url http://localhost:8546 anvil_stopImpersonatingAccount ${AIRDROP_MULTISIG_SAFE}`

  // console.log(chalk.blue('Disable auto-mining...'))
  // await $`cast rpc --rpc-url http://localhost:8546 evm_setAutomine false`

  // console.log(chalk.blue(`Re-enable interval mining... ${$.env.ANVIL_BLOCK_TIME ?? '2'}`))
  // await $`cast rpc --rpc-url http://localhost:8546 evm_setIntervalMining ${
  //   $.env.ANVIL_BLOCK_TIME ?? '2'
  // }` // mimics Tiltfile default

  // console.log(chalk.green('Done!'))
})()
