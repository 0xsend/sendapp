import { Chain, defineChain } from 'viem'
import { base as baseMainnetViem, localhost, mainnet as mainnetViem } from 'viem/chains'

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
export const baseLocal: Chain = defineChain({
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

export const appChains = {
  [String(mainnetViem.id)]: mainnetViem,
  [String(stagingMainnet.id)]: stagingMainnet,
  [String(localhost.id)]: localhost,
  [String(baseMainnetViem.id)]: baseMainnetViem,
  [String(baseLocal.id)]: baseLocal,
} as const

export const mainnet = (function mainnetFromEnv() {
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
export const baseMainnet: typeof baseMainnetViem | typeof baseLocal =
  (function baseMainnetFromEnv() {
    if (process.env.NEXT_PUBLIC_BASE_CHAIN_ID) {
      const chain = appChains[process.env.NEXT_PUBLIC_BASE_CHAIN_ID]
      if (!chain) {
        throw new Error(`Unknown chain id: ${process.env.NEXT_PUBLIC_BASE_CHAIN_ID}`)
      }
      return chain
    }
    if (__DEV__ || process.env.CI) {
      return baseLocal
    }
    return baseMainnetViem
  })()
