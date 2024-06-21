import 'zx/globals'

// $.verbose = true

if (!$.env.ANVIL_MAINNET_FORK_URL) {
  console.error(chalk.red('ANVIL_MAINNET_FORK_URL is not set.'))
  process.exit(1)
}
$.env.ANVIL_MAINNET_BLOCK_TIME ||= '2'
$.env.ANVIL_MAINNET_EXTRA_ARGS ||= '--silent'
$.env.NEXT_PUBLIC_MAINNET_CHAIN_ID ||= '1337'

const baseBaseFee = await $`cast base-fee --rpc-url $ANVIL_MAINNET_FORK_URL`
const baseGasPrice = await $`cast gas-price --rpc-url $ANVIL_MAINNET_FORK_URL`

// do not fork from the absolute latest block
const blockHeight = await $`cast bn --rpc-url $ANVIL_MAINNET_FORK_URL`.then(
  (r) => BigInt(r.stdout.trim()) - 30n
)

await $`docker rm -f sendapp-anvil-ethmainnet || true`

await $`docker run --rm \
          --network=supabase_network_send \
          -p=0.0.0.0:8546:8546 \
          --name=sendapp-anvil-ethmainnet \
          ghcr.io/foundry-rs/foundry "anvil \
            --host=0.0.0.0 \
            --port=8545 \
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
