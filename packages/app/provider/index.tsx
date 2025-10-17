import type { Session } from '@supabase/supabase-js'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Concerns } from 'app/concerns'
import type React from 'react'
import { AuthProvider } from './auth'
import { CoinsProvider } from './coins'
import { OnchainKitProvider } from './onchainkit'
import { QueryClientProvider } from './react-query'
import { SafeAreaProvider } from './safe-area'
import { TamaguiProvider } from './tamagui'
import { UniversalThemeProvider } from './theme'
import { ToastProvider } from './toast'
import { WagmiProvider } from './wagmi'
import ScrollDirectionProvider from 'app/provider/scroll/ScrollDirectionProvider'
import { ActivityDetailsProvider } from './activity-details'
import { GlobalDatePickerProvider } from './datepicker'
import { ShimmerProvider } from '@my/ui'

export { loadThemePromise } from './theme/UniversalThemeProvider'

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
        <ShimmerProvider duration={1500}>
          <Concerns>{children}</Concerns>
          {process.env.NEXT_PUBLIC_REACT_QUERY_DEV_TOOLS && <ReactQueryDevtools />}
        </ShimmerProvider>
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
  OnchainKitProvider,
  QueryClientProvider,
  UniversalThemeProvider,
  SafeAreaProvider,
  CoinsProvider,
  GlobalDatePickerProvider,
  TamaguiProvider,
  ToastProvider,
  ScrollDirectionProvider,
  ActivityDetailsProvider,
])
