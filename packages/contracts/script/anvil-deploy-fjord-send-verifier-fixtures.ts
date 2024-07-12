import 'zx/globals'
$.verbose = true

/**
 * This script is used to deploy the SendVerifier and SendAccountFactory contracts
 */

const RPC_URL = 'http://127.0.0.1:8546'
const baseSendMVPDeployer = '0x436454a68bef94901014e2af90f86e7355a029f3'
void (async function main() {
  console.log(chalk.blue('Enable auto-mining...'))
  await $`cast rpc --rpc-url ${RPC_URL} evm_setAutomine true`

  console.log(chalk.blue('Impersonating the airdrop multisig...'))
  await $`cast rpc --rpc-url http://localhost:8546 \
    anvil_impersonateAccount \
    ${baseSendMVPDeployer}`

  const broadcast = JSON.parse(
    await Bun.file(
      `${import.meta.dir}/../broadcast/DeploySendVerifier.s.sol/8453/run-latest.json`
    ).text()
  ) as {
    transactions: {
      contractName: string
      contractAddress: string
    }[]
  }
  const svpAddress = broadcast.transactions.find(
    (tx) => tx.contractName === 'SendVerifierProxy'
  )?.contractAddress
  console.log(chalk.blue(`Send Verifier Proxy address: ${svpAddress}`))

  $.env.SVP_ADDRESS = svpAddress

  console.log(chalk.blue('Deploying SendVerifier contract...'))
  await $`forge script DeployFjordSendVerifierScript \
              -vvvv \
              --rpc-url ${RPC_URL} \
              --unlocked \
              --sender ${baseSendMVPDeployer} \
              --broadcast`

  console.log(chalk.blue('Disable auto-mining...'))
  await $`cast rpc --rpc-url ${RPC_URL} evm_setAutomine false`

  console.log(chalk.blue(`Re-enable interval mining... ${$.env.ANVIL_BLOCK_TIME ?? '2'}`))
  await $`cast rpc --rpc-url ${RPC_URL} evm_setIntervalMining ${$.env.ANVIL_BLOCK_TIME ?? '2'}` // mimics Tiltfile default

  console.log(chalk.green('Done!'))
})()
