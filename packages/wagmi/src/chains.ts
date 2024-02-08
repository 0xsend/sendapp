import { defineChain } from 'viem'
import { base as baseMainnetViem, mainnet as mainnetViem } from 'viem/chains'

// @ts-expect-error __DEV__ so we can share some react native code
globalThis.__DEV__ = globalThis.__DEV__ ?? false

export const localhost = defineChain({
  id: 1_337,
  name: 'Mainnet Localhost',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
  },
  blockExplorers: {
    default: {
      name: 'Otterscan',
      url: 'http://localhost:5100/',
    },
  },
})

export const stagingMainnet = defineChain({
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
    default: { http: ['http://127.0.0.1:8546'] },
    public: { http: ['http://127.0.0.1:8546'] },
  },
  blockExplorers: {
    default: {
      name: 'Otterscan',
      url: 'http://localhost:5101/',
    },
  },
})

const mainnetChains = {
  [String(mainnetViem.id)]: mainnetViem,
  [String(stagingMainnet.id)]: stagingMainnet,
  [String(localhost.id)]: localhost,
} as const

const baseChains = {
  [String(baseMainnetViem.id)]: baseMainnetViem,
  [String(baseLocal.id)]: baseLocal,
} as const

export const mainnet: typeof mainnetViem | typeof localhost | typeof stagingMainnet =
  (function mainnetFromEnv() {
    if (process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID) {
      const chain = mainnetChains[process.env.NEXT_PUBLIC_MAINNET_CHAIN_ID]
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

export const baseMainnet: typeof baseMainnetViem | typeof baseLocal =
  (function baseMainnetFromEnv() {
    if (process.env.NEXT_PUBLIC_BASE_MAINNET_CHAIN_ID) {
      const chain = baseChains[process.env.NEXT_PUBLIC_BASE_MAINNET_CHAIN_ID]
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
