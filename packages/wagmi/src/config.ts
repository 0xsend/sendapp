import type { HttpTransport, PublicClient } from 'viem'
import { base as baseMainnetOg, mainnet as mainnetOg } from 'viem/chains'
import { createConfig } from 'wagmi'
import { baseMainnet, mainnet } from './chains'
import { baseMainnetClient, mainnetClient } from './client'

export const chains = [
  baseMainnet,
  mainnet,
  // baseMainnetOg, mainnetOg
] as const

export const client: ({ chain: { id } }) => PublicClient<HttpTransport, (typeof chains)[number]> =
  ({ chain: { id: chainId } }) => {
    if (chainId === mainnet.id) return mainnetClient
    if (chainId === baseMainnet.id) return baseMainnetClient
    // handle __DEV__ mode
    if (__DEV__ || process.env.NODE_ENV === 'development' || process.env.CI) {
      if (chainId === baseMainnetOg.id) {
        console.log(
          `⚠️ Overriding Base chain ID ${baseMainnetOg.id} with ${baseMainnetClient.chain.id} in __DEV__ mode`
        )
        return baseMainnetClient
      }
      if (chainId === mainnetOg.id) {
        console.log(
          `⚠️ Overriding Mainnet chain ID ${mainnetOg.id} with ${mainnetClient.chain.id} in __DEV__ mode`
        )
        return mainnetClient
      }
    }
    throw new Error(`Unknown chain id: ${chainId}`)
  }

/*
 * This is the default config for wagmi. It has no connectors and meant to be importable in non-browser environments.
 */
export const config = createConfig({
  connectors: [],
  chains,
  client,
  multiInjectedProviderDiscovery: false,
})
