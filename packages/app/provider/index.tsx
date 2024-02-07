import { Session } from '@supabase/supabase-js'
import React from 'react'
import { AuthProvider } from './auth'
import { QueryClientProvider } from './react-query'
import { SafeAreaProvider } from './safe-area'
import { TamaguiProvider } from './tamagui'
import { UniversalThemeProvider } from './theme'
import { ToastProvider } from './toast'
import { WagmiProvider } from './wagmi'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export function Provider({
  initialSession,
  children,
}: {
  initialSession?: Session | null
  children: React.ReactNode
}) {
  return (
    <AuthProvider initialSession={initialSession}>
      <Providers>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </Providers>
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
  WagmiProvider,
  UniversalThemeProvider,
  SafeAreaProvider,
  TamaguiProvider,
  ToastProvider,
  QueryClientProvider,
])
