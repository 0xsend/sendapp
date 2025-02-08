import { OnchainKitProvider as BaseOnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'
import type { FC, ReactNode } from 'react'

export const OnchainKitProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  return (
    <BaseOnchainKitProvider apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY} chain={base}>
      {children}
    </BaseOnchainKitProvider>
  )
}
