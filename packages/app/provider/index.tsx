import type { Session } from '@supabase/supabase-js'
import type React from 'react'
import { AuthProvider } from './auth'
import { QueryClientProvider } from './react-query'
import { SafeAreaProvider } from './safe-area'
import { TamaguiProvider } from './tamagui'
import { UniversalThemeProvider } from './theme'
import { ToastProvider } from './toast'
import { WagmiProvider } from 'wagmi'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { baseMainnet, mainnet } from '@my/wagmi'
import { base as baseMainnetOg, mainnet as mainnetOg } from 'wagmi/chains'
import { argentWallet, trustWallet, ledgerWallet } from '@rainbow-me/rainbowkit/wallets'
import { getDefaultWallets, getDefaultConfig } from '@rainbow-me/rainbowkit'

const { wallets } = getDefaultWallets()

export const config = getDefaultConfig({
  appName: '/send',
  appIcon:
    'https://github.com/0xsend/sendapp/blob/188fffab9b4d9ab6d332baad09ca14da3308f554/apps/next/public/favicon/apple-touch-icon.png',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '',
  chains: [baseMainnet, mainnet, baseMainnetOg, mainnetOg],
  wallets: [
    ...wallets,
    {
      groupName: 'Other',
      wallets: [argentWallet, trustWallet, ledgerWallet],
    },
  ],
  ssr: true,
})

export function Provider({
  initialSession,
  children,
}: {
  initialSession?: Session | null
  children: React.ReactNode
}) {
  return (
    <AuthProvider initialSession={initialSession}>
      <WagmiProvider config={config}>
        <Providers>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </Providers>
      </WagmiProvider>
    </AuthProvider>
  )
}

const compose = (providers: React.FC<{ children: React.ReactNode }>[]) =>
  providers.reduce((Prev, Curr) => ({ children }) => {
    const Provider = Prev ? (
      <Prev>
        <Curr>{children}</Curr>
      </Prev>
    ) : (
      <Curr>{children}</Curr>
    )
    return Provider
  })

const Providers = compose([
  UniversalThemeProvider,
  SafeAreaProvider,
  TamaguiProvider,
  ToastProvider,
  QueryClientProvider,
])
