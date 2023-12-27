import { createClient, createPublicClient, defineChain, http } from 'viem'
import {
  mainnet as mainnetViem,
  localhost,
  base as baseMainnetViem,
  type Chain,
} from 'wagmi/chains'
import debug from 'debug'
import { bundlerActions } from 'permissionless'

// TODO: convert to wagmi/core https://wagmi.sh/core/providers/configuring-chains

const log = debug('app:utils:viem:client')

const stagingMainnet: Chain = defineChain({
  id: 8008,
  name: 'Sendstack Anvil Staging',
  rpcUrls: {
    default: {
      http: ['https://sendstack-anvil.metalrodeo.xyz'],
    },
    public: {
      http: ['https://sendstack-anvil.metalrodeo.xyz'],
    },
  },
  nativeCurrency: mainnetViem.nativeCurrency,
  network: 'sendnet',
})

/**
 * Base Localhost is an anvil fork of Base Mainnet.
 */
const baseLocal: Chain = defineChain({
  id: 845337,
  name: 'Base Localhost',
  network: 'baselocalhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8546'] },
    public: { http: ['http://127.0.0.1:8546'] },
  },
})

const appChains = {
  [String(mainnetViem.id)]: mainnetViem,
  [String(stagingMainnet.id)]: stagingMainnet,
  [String(localhost.id)]: localhost,
  [String(baseMainnetViem.id)]: baseMainnetViem,
  [String(baseLocal.id)]: baseLocal,
} as const

export const mainnet = (() => {
  if (process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID) {
    const chain = appChains[process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID]
    if (!chain) {
      throw new Error(`Unknown chain id: ${process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID}`)
    }
    return chain
  }
  if (__DEV__ || process.env.CI) {
    return localhost
  }
  return mainnetViem
})()

log(
  'Using mainnet chain',
  `chain=${mainnet.name} (${mainnet.id}))`,
  `hostname=${new URL(mainnet.rpcUrls.default.http[0]).hostname}`
)

// allow for creating private RPC url
const MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL ?? process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? 'http://127.0.0.1:8545/'

export const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http(MAINNET_RPC_URL),
})

export const baseMainnet = (() => {
  if (process.env.NEXT_PUBLIC_BASE_MAINNET_CHAIN_ID) {
    const chain = appChains[process.env.NEXT_PUBLIC_BASE_MAINNET_CHAIN_ID]
    if (!chain) {
      throw new Error(`Unknown chain id: ${process.env.NEXT_PUBLIC_BASE_MAINNET_CHAIN_ID}`)
    }
    return chain
  }
  if (__DEV__ || process.env.CI) {
    return baseLocal
  }
  return baseMainnetViem
})()

log(
  'Using baseMainnet chain',
  `chain=${baseMainnet.name} (${baseMainnet.id}))`,
  `hostname=${new URL(baseMainnet.rpcUrls.default.http[0]).hostname}`
)

// allow for creating private RPC url
const BASE_MAINNET_RPC_URL =
  process.env.BASE_MAINNET_RPC_URL ??
  process.env.NEXT_PUBLIC_BASE_MAINNET_RPC_URL ??
  'http://127.0.0.1:8546/'

export const baseMainnetClient = createPublicClient({
  chain: baseMainnet,
  transport: http(BASE_MAINNET_RPC_URL),
})

export const baseMainnetBundlerClient = createClient({
  chain: baseMainnet,
  transport: http('http://127.0.0.1:3030/rpc'),
}).extend(bundlerActions)
