import 'zx/globals'

/**
 * This script is used to deploy the TokenPaymaster
 */

void (async function main() {
  console.log(chalk.blue('Enable auto-mining...'))
  await $`cast rpc --rpc-url base-local evm_setAutomine true`

  // base mainnet fork
  $.env.TOKEN = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC
  $.env.WETH = '0x4200000000000000000000000000000000000006'
  $.env.UNISWAP_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481' // Uniswap V3 SwapRouter
  $.env.TOKEN_ORACLE = '0x7e860098F58bBFC8648a4311b374B1D669a2bc6B' // USDC/USD
  $.env.NATIVE_ORACLE = '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70' // ETH/USD

  console.log(chalk.blue('Deploying TokenPaymaster contract...'))
  await $`forge script ./script/DeployTokenPaymaster.s.sol:DeployTokenPaymasterScript \
              -vvvv \
              --fork-url base-local \
              --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
              --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
              --broadcast`

  console.log(chalk.blue('Disable auto-mining...'))
  await $`cast rpc --rpc-url base-local evm_setAutomine false`

  console.log(chalk.blue(`Re-enable interval mining... ${$.env.ANVIL_BLOCK_TIME ?? '2'}`))
  await $`cast rpc --rpc-url base-local evm_setIntervalMining ${$.env.ANVIL_BLOCK_TIME ?? '2'}` // mimics Tiltfile default

  console.log(chalk.green('Done!'))
})()
