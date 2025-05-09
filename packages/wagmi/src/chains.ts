import debug from 'debug'
import { defineChain } from 'viem'
import { base as baseMainnetViem, baseSepolia, mainnet as mainnetViem, sepolia } from 'viem/chains'
import { isWeb } from './utils/platform'
import { getRpcUrl } from './utils/getRpcUrl'

const log = debug('wagmi:chains')

// allow for creating private RPC url
let MAINNET_RPC_URL =
  process.env.MAINNET_RPC_URL ?? process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? 'http://localhost:8545/'

// allow for creating private RPC url
let BASE_RPC_URL =
  process.env.BASE_RPC_URL ?? process.env.NEXT_PUBLIC_BASE_RPC_URL ?? 'http://localhost:8546/'

// In native environments, process the URLs to replace localhost with device IP
if (!isWeb) {
  MAINNET_RPC_URL = getRpcUrl(MAINNET_RPC_URL)
  BASE_RPC_URL = getRpcUrl(BASE_RPC_URL)
}

export const localhost = defineChain({
  id: 1_337,
  name: 'Mainnet Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: [MAINNET_RPC_URL] },
    public: { http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL ?? 'http://localhost:8545/'] },
  },
  blockExplorers: {
    default: {
      name: 'Otterscan',
      url: !isWeb ? getRpcUrl('http://localhost:5100') : 'http://localhost:5100',
      apiUrl: !isWeb ? getRpcUrl('http://localhost:5100') : 'http://localhost:5100',
    },
  },
})

/**
 * Base Localhost is an anvil fork of Base Mainnet.
 */
export const baseLocal = defineChain({
  id: 845337,
  name: 'Base Localhost',
  network: 'baselocalhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: [BASE_RPC_URL] },
    public: { http: [process.env.NEXT_PUBLIC_BASE_RPC_URL ?? 'http://localhost:8546/'] },
  },
  blockExplorers: {
    default: {
      name: 'Otterscan',
      url: !isWeb ? getRpcUrl('http://localhost:5101') : 'http://localhost:5101',
      apiUrl: !isWeb ? getRpcUrl('http://localhost:5100') : 'http://localhost:5100',
    },
  },
})

const mainnetChains = {
  [String(mainnetViem.id)]: {
    ...mainnetViem,
    rpcUrls: {
      default: { http: [MAINNET_RPC_URL] },
      public: { http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL] },
    },
  } as typeof mainnetViem,
  [String(sepolia.id)]: {
    ...sepolia,
    rpcUrls: {
      default: { http: [MAINNET_RPC_URL] },
      public: { http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL] },
    },
  } as typeof sepolia,
  [String(localhost.id)]: localhost,
} as const

const baseChains = {
  [String(baseMainnetViem.id)]: {
    ...baseMainnetViem,
    rpcUrls: {
      default: { http: [BASE_RPC_URL] },
      public: { http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL] },
    },
  } as typeof baseMainnetViem,
  [String(baseSepolia.id)]: {
    ...baseSepolia,
    rpcUrls: {
      default: { http: [BASE_RPC_URL] },
      public: { http: [process.env.NEXT_PUBLIC_MAINNET_RPC_URL] },
    },
  } as typeof baseSepolia,
  [String(baseLocal.id)]: baseLocal,
} as const

export const mainnet: typeof mainnetViem | typeof localhost | typeof sepolia =
  (function mainnetFromEnv() {
    if (process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID) {
      const chain = mainnetChains[process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID]
      log('mainnetFromEnv', `chain=${chain?.name} (${chain?.id})`)
      if (!chain) {
        throw new Error(`Unknown chain id: ${process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID}`)
      }
      return chain
    }
    if (__DEV__ || process.env.CI) {
      log('mainnetFromEnv', 'using localhost')
      return localhost
    }
    log('mainnetFromEnv', 'using mainnetViem')
    return mainnetViem
  })()

export const baseMainnet: typeof baseMainnetViem | typeof baseLocal | typeof baseSepolia =
  (function baseMainnetFromEnv() {
    if (process.env.NEXT_PUBLIC_BASE_CHAIN_ID) {
      const chain = baseChains[process.env.NEXT_PUBLIC_BASE_CHAIN_ID]
      log('baseMainnetFromEnv', `chain=${chain?.name} (${chain?.id})`)
      if (!chain) {
        throw new Error(`Unknown chain id: ${process.env.NEXT_PUBLIC_BASE_CHAIN_ID}`)
      }
      return chain
    }
    if (__DEV__ || process.env.CI) {
      log('baseMainnetFromEnv', 'using baseLocal')
      return baseLocal
    }
    log('baseMainnetFromEnv', 'using baseMainnetViem')
    return baseMainnetViem
  })()
