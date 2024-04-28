import 'zx/globals'

$.env.ANVIL_BASE_FORK_URL ||= 'https://base-pokt.nodies.app'
$.env.ANVIL_BASE_BLOCK_TIME ||= '2'
$.env.ANVIL_BASE_EXTRA_ARGS ||= '--silent'

const baseBaseFee = await $`cast base-fee --rpc-url $ANVIL_BASE_FORK_URL`
const baseGasPrice = await $`cast gas-price --rpc-url $ANVIL_BASE_FORK_URL`

await $`anvil \
    --host=0.0.0.0 \
    --port=8546 \
    --chain-id=845337 \
    --fork-url=$ANVIL_BASE_FORK_URL \
    --block-time=$ANVIL_BASE_BLOCK_TIME  \
    --base-fee=${baseBaseFee} \
    --gas-price=${baseGasPrice} \
    --no-storage-caching \
    --prune-history \
    $ANVIL_BASE_EXTRA_ARGS
`
