import 'zx/globals'

$.verbose = true

if (!$.env.ANVIL_BASE_FORK_URL) {
  console.error(chalk.red('ANVIL_BASE_FORK_URL is not set.'))
  process.exit(1)
}
$.env.ANVIL_BASE_BLOCK_TIME ||= '2'
$.env.ANVIL_BASE_EXTRA_ARGS ||= '--silent'
$.env.NEXT_PUBLIC_BASE_CHAIN_ID ||= '845337'

console.log(chalk.blue('Running anvil base node'), {
  ANVIL_BASE_FORK_URL: $.env.ANVIL_BASE_FORK_URL,
  ANVIL_BASE_BLOCK_TIME: $.env.ANVIL_BASE_BLOCK_TIME,
  ANVIL_BASE_EXTRA_ARGS: $.env.ANVIL_BASE_EXTRA_ARGS,
  NEXT_PUBLIC_BASE_CHAIN_ID: $.env.NEXT_PUBLIC_BASE_CHAIN_ID,
})

const baseBaseFee = await $`cast base-fee --rpc-url $ANVIL_BASE_FORK_URL`
const baseGasPrice = await $`cast gas-price --rpc-url $ANVIL_BASE_FORK_URL`

// do not fork from the absolute latest block
const blockHeight = await $`cast bn --rpc-url $ANVIL_BASE_FORK_URL`.then(
  (r) => BigInt(r.stdout.trim()) - 30n
)

await $`docker rm -f sendapp-anvil-base || true`

await $`docker run --rm \
          --platform=linux/amd64 \
          --network=supabase_network_send \
          -p=0.0.0.0:8546:8546 \
          --name=sendapp-anvil-base \
          --memory=200m \
          ghcr.io/foundry-rs/foundry:stable "anvil \
            --host=0.0.0.0 \
            --port=8546 \
            --chain-id=$NEXT_PUBLIC_BASE_CHAIN_ID \
            --fork-url=$ANVIL_BASE_FORK_URL \
            --block-time=$ANVIL_BASE_BLOCK_TIME  \
            --base-fee=${baseBaseFee} \
            --gas-price=${baseGasPrice} \
            --fork-block-number=${blockHeight} \
            $ANVIL_BASE_EXTRA_ARGS"
`
