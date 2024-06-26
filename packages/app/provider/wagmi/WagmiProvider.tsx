import type { FC, ReactNode } from 'react'
import { WagmiProvider as OGWagmiProvider } from 'wagmi'
import { projectId, config } from './config'

if (!projectId) throw new Error('Project ID is not defined')

export const WagmiProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  return <OGWagmiProvider config={config}>{children}</OGWagmiProvider>
}
