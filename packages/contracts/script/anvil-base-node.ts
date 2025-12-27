import 'zx/globals'

$.verbose = true

if (!$.env.ANVIL_BASE_FORK_URL) {
  console.error(chalk.red('ANVIL_BASE_FORK_URL is not set.'))
  process.exit(1)
}
$.env.ANVIL_BASE_BLOCK_TIME ||= '2'
$.env.ANVIL_BASE_EXTRA_ARGS ||= '--silent'
$.env.NEXT_PUBLIC_BASE_CHAIN_ID ||= '845337'
$.env.ANVIL_BASE_PORT ||= '8546'
$.env.SUPABASE_PROJECT_ID ||= 'sendapp'

const ANVIL_BASE_PORT = $.env.ANVIL_BASE_PORT
const SUPABASE_PROJECT_ID = $.env.SUPABASE_PROJECT_ID
const SUPABASE_NETWORK = `supabase_network_${SUPABASE_PROJECT_ID}`
const CONTAINER_NAME = `${SUPABASE_PROJECT_ID}-anvil-base`

console.log(chalk.blue('Running anvil base node'), {
  ANVIL_BASE_FORK_URL: $.env.ANVIL_BASE_FORK_URL,
  ANVIL_BASE_BLOCK_TIME: $.env.ANVIL_BASE_BLOCK_TIME,
  ANVIL_BASE_EXTRA_ARGS: $.env.ANVIL_BASE_EXTRA_ARGS,
  NEXT_PUBLIC_BASE_CHAIN_ID: $.env.NEXT_PUBLIC_BASE_CHAIN_ID,
  ANVIL_BASE_PORT: ANVIL_BASE_PORT,
})

const baseBaseFee = await $`cast base-fee --rpc-url $ANVIL_BASE_FORK_URL`
const baseGasPrice = await $`cast gas-price --rpc-url $ANVIL_BASE_FORK_URL`

// do not fork from the absolute latest block
const blockHeight = await $`cast bn --rpc-url $ANVIL_BASE_FORK_URL`.then(
  (r) => BigInt(r.stdout.trim()) - 30n
)

await $`docker rm -f ${CONTAINER_NAME}`

// Start docker container in the background
await $`docker run --rm \
          -d \
          --platform=linux/amd64 \
          -m 2g \
          --memory-swap 2g \
          --network=${SUPABASE_NETWORK} \
          -p=0.0.0.0:${ANVIL_BASE_PORT}:${ANVIL_BASE_PORT} \
          --name=${CONTAINER_NAME} \
          ghcr.io/foundry-rs/foundry:stable "anvil \
            --host=0.0.0.0 \
            --port=${ANVIL_BASE_PORT} \
            --chain-id=$NEXT_PUBLIC_BASE_CHAIN_ID \
            --fork-url=$ANVIL_BASE_FORK_URL \
            --block-time=$ANVIL_BASE_BLOCK_TIME  \
            --base-fee=${baseBaseFee} \
            --gas-price=${baseGasPrice} \
            --fork-block-number=${blockHeight} \
            $ANVIL_BASE_EXTRA_ARGS"
`

// Wait for the RPC node to be ready by polling it
console.log(chalk.yellow('Waiting for RPC node to be ready...'))
let retries = 0
const maxRetries = 30
const LOCAL_RPC_URL = `http://127.0.0.1:${ANVIL_BASE_PORT}`
while (retries < maxRetries) {
  try {
    await $`cast bn --rpc-url ${LOCAL_RPC_URL}`
    console.log(chalk.green('RPC node is ready!'))
    break
  } catch (error) {
    retries++
    if (retries === maxRetries) {
      console.error(chalk.red('RPC node failed to start after 30 attempts'))
      process.exit(1)
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

console.log(chalk.yellow('Prefetching remote state to avoid long initial RPC delays...'))

// Prefetch critical contract state to avoid 10-20 second delays on first access
// This includes factory contract methods and key storage lookups
const prefetchPromises: Promise<unknown>[] = []

// List of important contract addresses we need to prefetch
const importantContracts = [
  // Factory contracts
  {
    address: '0x008c9561857b6555584d20aC55110335759Aa2c2',
    name: 'SendAccountFactory',
  },
  // EntryPoint contracts
  {
    address: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
    name: 'EntryPoint v0.7',
  },
  {
    address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    name: 'EntryPoint v0.6',
  },
  // Token contracts
  {
    address: '0xEab49138BA2Ea6dd776220fE26b7b8E446638956',
    name: 'SEND Token',
  },
  {
    address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    name: 'USDC',
  },
]

// Use the local anvil instance for prefetching (not the remote fork URL)
// LOCAL_RPC_URL is defined above

// Prefetch code and basic calls for each contract
for (const contract of importantContracts) {
  console.log(`Prefetching ${contract.name}...`)

  // Prefetch the contract code
  prefetchPromises.push($`cast code ${contract.address} --rpc-url ${LOCAL_RPC_URL}`)

  // For tokens, prefetch name and symbol
  if (contract.name.includes('Token') || contract.name === 'USDC') {
    prefetchPromises.push(
      $`cast call ${contract.address} "name()(string)" --rpc-url ${LOCAL_RPC_URL}`
    )
    prefetchPromises.push(
      $`cast call ${contract.address} "symbol()(string)" --rpc-url ${LOCAL_RPC_URL}`
    )
    prefetchPromises.push(
      $`cast call ${contract.address} "decimals()(uint8)" --rpc-url ${LOCAL_RPC_URL}`
    )
    prefetchPromises.push(
      $`cast call ${contract.address} "totalSupply()(uint256)" --rpc-url ${LOCAL_RPC_URL}`
    )
  }

  // For factory, prefetch implementation addresses
  if (contract.name === 'SendAccountFactory') {
    prefetchPromises.push(
      $`cast call ${contract.address} "accountImplementation()(address)" --rpc-url ${LOCAL_RPC_URL}`
    )
    prefetchPromises.push(
      $`cast call ${contract.address} "entryPoint()(address)" --rpc-url ${LOCAL_RPC_URL}`
    )
    prefetchPromises.push(
      $`cast call ${contract.address} "verifier()(address)" --rpc-url ${LOCAL_RPC_URL}`
    )
  }

  // For EntryPoint contracts, prefetch common methods
  if (contract.name.includes('EntryPoint')) {
    // Get deposits for common addresses - this is often checked
    const commonAddresses = [
      '0x008c9561857b6555584d20aC55110335759Aa2c2', // factory
      '0x436454a68BEF94901014E2AF90f86E7355a029F3', // deployer
    ]
    for (const addr of commonAddresses) {
      prefetchPromises.push(
        $`cast call ${contract.address} "deposits(address)(uint256)" ${addr} --rpc-url ${LOCAL_RPC_URL}`
      )
    }
  }
}

// Prefetch some common storage slots that might be accessed
console.log('Prefetching common storage slots...')
const storageSlots = ['0x0', '0x1', '0x2', '0x3', '0x4']
for (const slot of storageSlots) {
  for (const contract of importantContracts) {
    prefetchPromises.push($`cast storage ${contract.address} ${slot} --rpc-url ${LOCAL_RPC_URL}`)
  }
}

// Execute all prefetch operations in parallel
await Promise.all(prefetchPromises).catch((err) => {
  console.warn(chalk.yellow('Some prefetch operations failed, but continuing...'))
})

console.log(chalk.green('Remote state prefetching complete!'))

// Now attach to the container logs to see output
console.log(chalk.blue('Attaching to container logs...'))
await $`docker logs -f ${CONTAINER_NAME}`
