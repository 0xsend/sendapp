import type { FC, ReactNode } from 'react'

// TODO: fix OnchainKitProvider for native
export const OnchainKitProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  return children
}
