import { OnchainKitProvider as BaseOnchainKitProvider } from '@coinbase/onchainkit'
import { base } from 'wagmi/chains'
import type { FC, ReactNode } from 'react'

export const OnchainKitProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  return (
    // @ts-expect-error: Type is not assignable to type 'Chain'
    <BaseOnchainKitProvider apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY} chain={base}>
      {children}
    </BaseOnchainKitProvider>
  )
}
