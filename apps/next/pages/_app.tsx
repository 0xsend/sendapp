import '../public/reset.css'
import '../styles/globals.css'

import 'raf/polyfill'

import '@my/ui/src/config/fonts.css'

import { type ColorScheme, NextThemeProvider, useRootTheme } from '@tamagui/next-theme'

import { Provider } from 'app/provider'
import type { AuthProviderProps } from 'app/provider/auth'
import { api } from 'app/utils/api'
import type { NextPage } from 'next'
import Head from 'next/head'
import type { ReactElement, ReactNode } from 'react'
import type { SolitoAppProps } from 'solito'

if (process.env.NODE_ENV === 'production') {
  require('../public/tamagui.css')
}

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode
}

function MyApp({
  Component,
  pageProps,
}: SolitoAppProps<{ initialSession: AuthProviderProps['initialSession'] }>) {
  // reference: https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts
  const getLayout = Component.getLayout || ((page) => page)

  const [, setTheme] = useRootTheme()

  return (
    <>
      <Head>
        <title>Send</title>
        <meta
          key="description"
          name="description"
          content="Peer-to-peer money. Send. Save. Invest."
        />
        <meta
          name="viewport"
          content="viewport-fit=cover, user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#122023" />
        <meta name="msapplication-TileColor" content="#122023" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#081619" media="(prefers-color-scheme: dark)" />

        {/* Default OG tags - add keys to all that might be overridden */}
        <meta key="og:type" property="og:type" content="website" />
        <meta key="og:title" property="og:title" content="Send" />
        <meta
          key="og:description"
          property="og:description"
          content="Peer-to-peer money. Send. Save. Invest."
        />
        <meta key="og:site_name" property="og:site_name" content="Send" />
        <meta key="og:url" property="og:url" content="https://send.app" />
        <meta
          key="og:image"
          property="og:image"
          content="https://ghassets.send.app/2024/04/send-og-image.png"
        />
        <meta key="og:image:width" property="og:image:width" content="800" />
        <meta key="og:image:height" property="og:image:height" content="630" />
        <meta key="og:image:type" property="og:image:type" content="image/png" />

        {/* Default Twitter tags */}
        <meta key="twitter:card" name="twitter:card" content="summary_large_image" />
        <meta key="twitter:title" name="twitter:title" content="Send" />
        <meta
          key="twitter:description"
          name="twitter:description"
          content="Peer-to-peer money. Send. Save. Invest."
        />
        <meta
          key="twitter:image"
          name="twitter:image"
          content="https://ghassets.send.app/2024/04/send-og-image.png"
        />
        <meta key="twitter:site" name="twitter:site" content="send" />
        <link rel="stylesheet" href="/tamagui.css" />
      </Head>
      <NextThemeProvider
        onChangeTheme={(next) => {
          setTheme(next as ColorScheme)
        }}
      >
        <Provider initialSession={pageProps.initialSession}>
          {getLayout(<Component {...pageProps} />)}
        </Provider>
      </NextThemeProvider>
    </>
  )
}

export default api.withTRPC(MyApp)
