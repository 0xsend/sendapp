import { mainnet } from 'app/utils/viem/chains'
import { mainnetClient } from 'app/utils/viem/client'
import { type FC, type ReactNode } from 'react'
import { WagmiConfig, createConfig } from 'wagmi'
import { InjectedConnector } from 'wagmi/connectors/injected'

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
  // @ts-expect-error no idea why this is happening
  publicClient: mainnetClient,
})

export const WagmiProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  return <WagmiConfig config={config}>{children}</WagmiConfig>
}
