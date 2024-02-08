import debug from 'debug'
import { bundlerActions } from 'permissionless'
import { http, createClient, createPublicClient } from 'viem'
import { mainnet, baseMainnet } from './chains'

const log = debug('app:utils:viem:client')

log(
  'Using mainnet chain',
  `chain=${mainnet.name} (${mainnet.id})`,
  `hostname=${new URL(mainnet.rpcUrls.default.http[0]).hostname}`
)

// allow for creating private RPC url
const MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL ?? process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? 'http://127.0.0.1:8545/'

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(MAINNET_RPC_URL),
})

log(
  'Using baseMainnet chain',
  `chain=${baseMainnet.name} (${baseMainnet.id})`,
  `hostname=${new URL(baseMainnet.rpcUrls.default.http[0]).hostname}`
)

// allow for creating private RPC url
const BASE_RPC_URL =
  process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL ?? 'http://127.0.0.1:8546/'

export const baseMainnetClient = createPublicClient({
  chain: baseMainnet,
  transport: http(BASE_RPC_URL),
})

const BUNDLER_RPC_URL =
  process.env.BUNDLER_RPC_URL ??
  process.env.NEXT_PUBLIC_BUNDLER_RPC_URL ??
  'http://127.0.0.1:3030/rpc'
export const baseMainnetBundlerClient = createClient({
  chain: baseMainnet,
  transport: http(BUNDLER_RPC_URL),
}).extend(bundlerActions)
