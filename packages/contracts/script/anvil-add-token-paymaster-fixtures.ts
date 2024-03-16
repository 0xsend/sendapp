import 'zx/globals'

/**
 * This script is used to deploy the TokenPaymaster
 */

const RPC_URL = 'http://localhost:8546'
void (async function main() {
  // console.log(chalk.blue('Enable auto-mining...'))
  // await $`cast rpc --rpc-url ${RPC_URL} evm_setAutomine true`

  // ensure these are set in the environment
  // TOKEN
  // WETH
  // UNISWAP_ROUTER
  // TOKEN_ORACLE
  // NATIVE_ORACLE

  console.log(chalk.blue('Deploying TokenPaymaster contract...'))
  await $`forge script ./script/DeployTokenPaymaster.s.sol:DeployTokenPaymasterScript \
              -vvvv \
              --fork-url ${RPC_URL} \
              --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
              --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
              --broadcast`

  // console.log(chalk.blue('Disable auto-mining...'))
  // await $`cast rpc --rpc-url ${RPC_URL} evm_setAutomine false`

  // console.log(chalk.blue(`Re-enable interval mining... ${$.env.ANVIL_BLOCK_TIME ?? '2'}`))
  // await $`cast rpc --rpc-url ${RPC_URL} evm_setIntervalMining ${$.env.ANVIL_BLOCK_TIME ?? '2'}` // mimics Tiltfile default

  console.log(chalk.green('Done!'))
})()
