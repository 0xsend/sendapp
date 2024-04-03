import { config } from '@my/wagmi'
import type { FC, ReactNode } from 'react'
import { WagmiProvider as OGWagmiProvider } from 'wagmi'

// use the default config for now (no connectors and no discovery)
export const WagmiProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  return <OGWagmiProvider config={config}>{children}</OGWagmiProvider>
}
