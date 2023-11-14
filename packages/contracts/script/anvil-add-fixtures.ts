import 'zx/globals'

/**
 * This script is used to deploy the SendMerkleDrop contract and add a tranche to the airdrop. It should be adapted as things are deployed to mainnet.
 */

const AIRDROP_MULTISIG_SAFE = '0x6204Bc0662ccd8a9A762d59fe7906733f251E3b7'

void (async function main() {
  const PACKAGE_ROOT = await $`git rev-parse --show-toplevel`

  console.log(chalk.blue('Enable auto-mining...'))
  await $`cast rpc --rpc-url http://localhost:8545 evm_setAutomine true`

  await within(async () => {
    cd(PACKAGE_ROOT)
    console.log(chalk.blue('Deploying SendMerkleDrop contract...'))
    await $`forge script ${PACKAGE_ROOT}/packages/contracts/script/DeploySendMerkleDrop.s.sol:DeploySendMerkleDropScript \
              -vvvv \
              --fork-url http://localhost:8545 \
              --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
              --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
              --broadcast`
  })

  console.log(chalk.blue('Sending 10 ether to the airdrop multisig...'))
  await $`cast send --rpc-url http://localhost:8545 \
            --unlocked \
            --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
            ${AIRDROP_MULTISIG_SAFE} \
            --value 10ether`

  console.log(chalk.blue('Impersonating the airdrop multisig...'))
  await $`cast rpc --rpc-url http://localhost:8545 \
    anvil_impersonateAccount \
    ${AIRDROP_MULTISIG_SAFE}`

  await within(async () => {
    cd(PACKAGE_ROOT)
    console.log(chalk.blue('Adding a tranche to the airdrop...'))
    await $`forge script ${PACKAGE_ROOT}/packages/contracts/script/CreateSendDistributionTranche.s.sol:CreateSendDistributionTrancheScript \
              -vvvv \
              --fork-url http://localhost:8545 \
              --unlocked \
              --sender ${AIRDROP_MULTISIG_SAFE} \
              --broadcast`
  })

  console.log(chalk.blue('Stop impersonating the airdrop multisig...'))
  await $`cast rpc --rpc-url http://localhost:8545 anvil_stopImpersonatingAccount ${AIRDROP_MULTISIG_SAFE}`

  console.log(chalk.blue('Disable auto-mining...'))
  await $`cast rpc --rpc-url http://localhost:8545 evm_setAutomine false`

  console.log(chalk.blue(`Re-enable interval mining... ${$.env.ANVIL_BLOCK_TIME ?? '5'}`))
  await $`cast rpc --rpc-url http://localhost:8545 evm_setIntervalMining ${
    $.env.ANVIL_BLOCK_TIME ?? '5'
  }` // mimics Tiltfile default

  console.log(chalk.green('Done!'))
})()
