import { baseMainnet, mainnet } from './chains'
import { base as baseMainnetOg, mainnet as mainnetOg } from 'viem/chains'
import { mainnetClient, baseMainnetClient } from './client'
import { createConfig } from 'wagmi'
import { injected, walletConnect, coinbaseWallet, safe } from 'wagmi/connectors'

export const config = createConfig({
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    walletConnect({
      projectId:
        process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '3fcc6bba6f1de962d911bb5b5c3dba68',
      metadata: {
        name: '/send',
        description: 'Send ',
        url: 'https://send.it',
        icons: [
          'https://github.com/0xsend/sendapp/blob/188fffab9b4d9ab6d332baad09ca14da3308f554/apps/next/public/favicon/apple-touch-icon.png',
        ],
      },
    }),
    coinbaseWallet({
      appName: '/send',
    }),
    safe({ allowedDomains: [/app.safe.global$/] }),
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
