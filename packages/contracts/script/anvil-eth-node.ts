import 'zx/globals'

// $.verbose = true

if (!$.env.ANVIL_MAINNET_FORK_URL) {
  console.error(chalk.red('ANVIL_MAINNET_FORK_URL is not set.'))
  process.exit(1)
}
$.env.ANVIL_MAINNET_BLOCK_TIME ||= '2'
$.env.ANVIL_MAINNET_EXTRA_ARGS ||= '--silent'
$.env.NEXT_PUBLIC_MAINNET_CHAIN_ID ||= '1337'
$.env.ANVIL_MAINNET_PORT ||= '8545'
$.env.WORKSPACE_NAME ||= $.env.SUPABASE_PROJECT_ID || 'sendapp'
$.env.SUPABASE_PROJECT_ID ||= $.env.WORKSPACE_NAME

const ANVIL_MAINNET_PORT = $.env.ANVIL_MAINNET_PORT
const WORKSPACE_NAME = $.env.WORKSPACE_NAME
const SUPABASE_PROJECT_ID = $.env.SUPABASE_PROJECT_ID
const SUPABASE_NETWORK = `supabase_network_${SUPABASE_PROJECT_ID}`
const CONTAINER_NAME = `${WORKSPACE_NAME}-anvil-mainnet`

const baseBaseFee = await $`cast base-fee --rpc-url $ANVIL_MAINNET_FORK_URL`
const baseGasPrice = await $`cast gas-price --rpc-url $ANVIL_MAINNET_FORK_URL`

// do not fork from the absolute latest block
const blockHeight = await $`cast bn --rpc-url $ANVIL_MAINNET_FORK_URL`.then(
  (r) => BigInt(r.stdout.trim()) - 30n
)

await $`docker rm -f ${CONTAINER_NAME} || true`

await $`docker run --rm \
          --platform=linux/amd64 \
          --network=${SUPABASE_NETWORK} \
          -p=0.0.0.0:${ANVIL_MAINNET_PORT}:${ANVIL_MAINNET_PORT} \
          --name=${CONTAINER_NAME} \
          ghcr.io/foundry-rs/foundry "anvil \
            --host=0.0.0.0 \
            --port=${ANVIL_MAINNET_PORT} \
            --chain-id=$NEXT_PUBLIC_MAINNET_CHAIN_ID \
            --fork-url=$ANVIL_MAINNET_FORK_URL \
            --block-time=$ANVIL_MAINNET_BLOCK_TIME  \
            --base-fee=${baseBaseFee} \
            --gas-price=${baseGasPrice} \
            --no-storage-caching \
            --prune-history \
            --fork-block-number=${blockHeight} \
            $ANVIL_MAINNET_EXTRA_ARGS"
`
