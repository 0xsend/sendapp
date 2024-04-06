import { chains } from '@my/wagmi'
import type { FC, ReactNode } from 'react'
import { WagmiProvider as OGWagmiProvider } from 'wagmi'

import {
  argentWallet,
  trustWallet,
  ledgerWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { getDefaultWallets, getDefaultConfig } from '@rainbow-me/rainbowkit'

const { wallets } = getDefaultWallets()

// use the awesome rainbowkit config on web
export const config = getDefaultConfig({
  appName: '/send',
  appIcon:
    'https://github.com/0xsend/sendapp/blob/188fffab9b4d9ab6d332baad09ca14da3308f554/apps/next/public/favicon/apple-touch-icon.png',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  chains,
  wallets: [
    ...wallets,
    {
      groupName: 'Other',
      wallets: [injectedWallet, argentWallet, trustWallet, ledgerWallet],
    },
  ],
  ssr: true,
})

export const WagmiProvider: FC<{ children: ReactNode }> = ({
  children,
}: {
  children: ReactNode
}) => {
  return <OGWagmiProvider config={config}>{children}</OGWagmiProvider>
}
