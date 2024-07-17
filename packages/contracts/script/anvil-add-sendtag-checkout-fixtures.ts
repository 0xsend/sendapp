import 'zx/globals'
$.verbose = true

/**
 * This script is used to deploy the DeploySendtagCheckout
 */

const RPC_URL = 'http://127.0.0.1:8546'
void (async function main() {
  console.log(chalk.blue('Enable auto-mining...'))
  await $`cast rpc --rpc-url ${RPC_URL} evm_setAutomine true`

  $.env.MULTISIG = '0x71fa02bb11e4b119bEDbeeD2f119F62048245301'
  $.env.TOKEN = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'

  console.log(
    `${chalk.blue('Deploying DeploySendtagCheckout contract...')}
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

  console.log(chalk.blue('Disable auto-mining...'))
  await $`cast rpc --rpc-url ${RPC_URL} evm_setAutomine false`

  console.log(chalk.blue(`Re-enable interval mining... ${$.env.ANVIL_BLOCK_TIME ?? '2'}`))
  await $`cast rpc --rpc-url ${RPC_URL} evm_setIntervalMining ${$.env.ANVIL_BLOCK_TIME ?? '2'}` // mimics Tiltfile default

  console.log(chalk.green('Done!'))
})()
