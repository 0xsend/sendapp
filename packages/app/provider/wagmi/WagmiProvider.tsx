import { WagmiProvider as OGWagmiProvider } from 'wagmi'
import { config } from '@my/wagmi'
import type { FC, ReactNode } from 'react'

export const WagmiProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  const appConfig = { ...config, ssr: true }
  return <OGWagmiProvider config={appConfig}>{children}</OGWagmiProvider>
}

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
