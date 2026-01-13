import '../public/reset.css'
import '../styles/globals.css'

import 'raf/polyfill'
import 'react-native-gesture-handler'
import 'react-native-reanimated'

import '@my/ui/src/config/fonts.css'

import { type ColorScheme, NextThemeProvider, useRootTheme } from '@tamagui/next-theme'

import { AnalyticsErrorBoundary, ErrorFallback } from 'app/components/ErrorBoundary'
import { Provider } from 'app/provider'
import { getI18n, initSharedI18n, resolvePreferredLocale, DEFAULT_LOCALE } from 'app/i18n'
import type { AuthProviderProps } from 'app/provider/auth'
import { api } from 'app/utils/api'
import type { NextPage } from 'next'
import { DefaultSeo } from 'next-seo'
import { type ReactElement, type ReactNode, useEffect, useRef } from 'react'
import type { SolitoAppProps } from 'solito'

import { defaultSEOConfig } from '../config/next-seo'
import Head from 'next/head'
import { NextSeo } from 'next-seo'
import type { buildSeo } from 'utils/seo'
import { NotificationAutoPrompt } from '../components/NotificationAutoPrompt'

if (process.env.NODE_ENV === 'production') {
  require('../public/tamagui.css')
}

if (typeof window !== 'undefined') {
  window.global = window
}

// Initialize with English immediately to avoid async detection race
void initSharedI18n({ initialLanguage: DEFAULT_LOCALE }).catch((error) => {
  console.error('[i18n] failed to initialize during import', error)
})

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

function MyApp({
  Component,
  pageProps,
}: SolitoAppProps<{
  initialSession: AuthProviderProps['initialSession']
  seo?: ReturnType<typeof buildSeo>
}>) {
  const [, setTheme] = useRootTheme()
  const swRegistered = useRef(false)

  // Register service worker for web push notifications
  useEffect(() => {
    if (swRegistered.current) return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    swRegistered.current = true

    navigator.serviceWorker
      .register('/service_worker.js', { scope: '/' })
      .then((registration) => {
        console.log('[SW] Service worker registered:', registration.scope)
      })
      .catch((error) => {
        console.error('[SW] Service worker registration failed:', error)
      })
  }, [])

  useEffect(() => {
    // Update to user's preferred locale after hydration (stored preference only)
    const instance = getI18n()
    if (instance) {
      resolvePreferredLocale()
        .then((preferred) => {
          if (preferred && instance.language !== preferred) {
            return instance.changeLanguage(preferred)
          }
        })
        .catch((error) => {
          console.error('[i18n] failed to update locale on client', error)
        })
    }
  }, [])

  const i18n = getI18n()
  if (!i18n) {
    return null
  }
  // reference: https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts
  const getLayout = Component.getLayout || ((page) => page)

  // Only render DefaultSeo if the page doesn't provide its own SEO
  const hasPageSeo = pageProps.seo !== undefined

  return (
    <>
      {hasPageSeo ? <NextSeo {...pageProps.seo} /> : <DefaultSeo {...defaultSEOConfig} />}
      <Head>
        <meta
          name="viewport"
          content="viewport-fit=cover, user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>

      <NextThemeProvider
        onChangeTheme={(next) => {
          setTheme(next as ColorScheme)
        }}
      >
        <Provider initialSession={pageProps.initialSession} i18n={i18n}>
          <AnalyticsErrorBoundary
            componentName="AppRoot"
            fallback={({ error, resetError }) => (
              <ErrorFallback error={error} resetError={resetError} />
            )}
          >
            <NotificationAutoPrompt />
            {getLayout(<Component {...pageProps} />)}
          </AnalyticsErrorBoundary>
        </Provider>
      </NextThemeProvider>
    </>
  )
}

export default api.withTRPC(MyApp)
