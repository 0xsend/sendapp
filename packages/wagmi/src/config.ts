import { baseMainnet, mainnet } from './chains'
import { mainnetClient, baseMainnetClient } from './client'
import { createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'

export const config = createConfig({
  chains: [baseMainnet, mainnet],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  client({ chain: { id: chainId } }) {
    if (chainId === mainnet.id) return mainnetClient
    if (chainId === baseMainnet.id) return baseMainnetClient
    throw new Error(`Unknown chain id: ${chainId}`)
  },
  multiInjectedProviderDiscovery: false,
})
