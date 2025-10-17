import type { Session } from '@supabase/supabase-js'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import type { i18n } from 'i18next'
import { Concerns } from 'app/concerns'
import { getI18n } from 'app/i18n'
import type React from 'react'
import { I18nextProvider } from 'react-i18next'
import { ActivityDetailsProvider } from './activity-details'
import { AuthProvider } from './auth'
import { CoinsProvider } from './coins'
import { GlobalDatePickerProvider } from './datepicker'
import { OnchainKitProvider } from './onchainkit'
import { QueryClientProvider } from './react-query'
import ScrollDirectionProvider from './scroll/ScrollDirectionProvider'
import { SafeAreaProvider } from './safe-area'
import { TamaguiProvider } from './tamagui'
import { ToastProvider } from './toast'
import { UniversalThemeProvider } from './theme'
import { WagmiProvider } from './wagmi'

export { loadThemePromise } from './theme/UniversalThemeProvider'

export function Provider({
  initialSession,
  i18n,
  children,
}: {
  initialSession?: Session | null
  i18n?: i18n | null
  children: React.ReactNode
}) {
  const i18nInstance = i18n ?? getI18n()

  if (!i18nInstance) {
    throw new Error(
      'Provider requires an initialized i18n instance. Call initSharedI18n() before rendering.'
    )
  }

  return (
    <I18nextProvider i18n={i18nInstance}>
      <AuthProvider initialSession={initialSession}>
        <Providers>
          <Concerns>{children}</Concerns>
          {process.env.NEXT_PUBLIC_REACT_QUERY_DEV_TOOLS && <ReactQueryDevtools />}
        </Providers>
      </AuthProvider>
    </I18nextProvider>
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
