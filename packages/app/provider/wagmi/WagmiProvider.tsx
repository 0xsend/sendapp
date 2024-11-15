import { WagmiProvider as OGWagmiProvider } from 'wagmi'
import { config } from '@my/wagmi'
import type { FC, ReactNode } from 'react'

export const WagmiProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  return <OGWagmiProvider config={config}>{children}</OGWagmiProvider>
}

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
