import { baseMainnet, mainnet } from './chains'
import { base as baseMainnetOg, mainnet as mainnetOg } from 'viem/chains'
import { mainnetClient, baseMainnetClient } from './client'
import { createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  chains: [baseMainnet, mainnet, baseMainnetOg, mainnetOg],
  client({ chain: { id: chainId } }) {
    if (chainId === mainnet.id) return mainnetClient
    if (chainId === baseMainnet.id) return baseMainnetClient
    // handle __DEV__ mode
    if (__DEV__) {
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
  },
  multiInjectedProviderDiscovery: false,
})
