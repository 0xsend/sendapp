import 'zx/globals'

const baseForkUrl = $.env.ANVIL_BASE_FORK_URL ?? 'https://base-pokt.nodies.app'
const baseBlockTime = $.env.ANVIL_BASE_BLOCK_TIME ?? '2'
const baseExtraArgs = $.env.ANVIL_BASE_EXTRA_ARGS ?? '--silent'
const baseBaseFee = await $`cast base-fee --rpc-url ${baseForkUrl}`
const baseGasPrice = await $`cast gas-price --rpc-url ${baseForkUrl}`

await $`anvil \
    --host=0.0.0.0 \
    --port=8546 \
    --chain-id=845337 \
    --fork-url=${baseForkUrl} \
    --block-time=${baseBlockTime} \
    --base-fee=${baseBaseFee} \
    --gas-price=${baseGasPrice} \
    --no-storage-caching \
    --prune-history \
    ${baseExtraArgs}
`
