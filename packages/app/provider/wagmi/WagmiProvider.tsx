import { type FC, type ReactNode } from 'react'
import { WagmiConfig, createConfig } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'
import { mainnet, mainnetClient } from 'app/utils/viem/client'

const config = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains: [mainnet],
      options: {
        shimDisconnect: true,
      },
    }),
  ],
  publicClient: mainnetClient,
})

export const WagmiProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  return <WagmiConfig config={config}>{children}</WagmiConfig>
}
