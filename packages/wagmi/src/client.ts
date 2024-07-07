import debug from 'debug'
import { bundlerActions, ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import { http, createClient, createPublicClient } from 'viem'
import { mainnet, baseMainnet } from './chains.js'

const log = debug('app:utils:viem:client')

log(
  'Using mainnet chain',
  `chain=${mainnet.name} (${mainnet.id})`,
  `hostname=${new URL(mainnet.rpcUrls.default.http[0]).hostname}`
)

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(mainnet.rpcUrls.default.http[0]),
})

log(
  'Using baseMainnet chain',
  `chain=${baseMainnet.name} (${baseMainnet.id})`,
  `hostname=${new URL(baseMainnet.rpcUrls.default.http[0]).hostname}`
)

export const baseMainnetClient = createPublicClient({
  chain: baseMainnet,
  transport: http(baseMainnet.rpcUrls.default.http[0]),
})

const BUNDLER_RPC_URL =
  process.env.BUNDLER_RPC_URL ??
  process.env.NEXT_PUBLIC_BUNDLER_RPC_URL ??
  'http://127.0.0.1:3030/rpc'
export const baseMainnetBundlerClient = createClient({
  chain: baseMainnet,
  transport: http(BUNDLER_RPC_URL),
}).extend(bundlerActions(ENTRYPOINT_ADDRESS_V07))
