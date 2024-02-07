import { mainnet } from 'app/utils/viem/chains'
import { mainnetClient } from 'app/utils/viem/client'
import { type FC, type ReactNode } from 'react'
import { WagmiProvider as OGWagmiProvider, createConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'

const config = createConfig({
  chains: [mainnet],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
  ],
  client({ chain }) {
    if (chain.id === mainnetClient.chain.id) return mainnetClient
    throw new Error(`Invalid chain: ${chain.id}`)
  },
})

export const WagmiProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  return <OGWagmiProvider config={config}>{children}</OGWagmiProvider>
}
