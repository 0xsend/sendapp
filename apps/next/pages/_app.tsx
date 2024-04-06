import '@rainbow-me/rainbowkit/styles.css'
import '../public/reset.css'
import '../styles/globals.css'

import 'raf/polyfill'
import '@my/ui/src/config/fonts.css'

import { type ColorScheme, NextThemeProvider, useRootTheme } from '@tamagui/next-theme'

import type { AuthProviderProps } from 'app/provider/auth'
import { api } from 'app/utils/api'
import type { NextPage } from 'next'
import Head from 'next/head'
import type { ReactElement, ReactNode } from 'react'
import type { SolitoAppProps } from 'solito'
import { Provider } from 'app/provider'

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
          name="description"
          content="Send App harnesses Ethereum's latest advancements, notably account abstraction, to simplify cryptocurrency entry. By integrating this into Ethereum, we streamline transactions and contracts, complemented by Send App's user-friendly design."
        />
        <meta
          name="viewport"
          content="width=320, initial-scale=1, minimum-scale=1, maximum-scale=1"
        />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#122023" />
        <meta name="msapplication-TileColor" content="#122023" />
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#122023" media="(prefers-color-scheme: dark)" />
        <meta property="og:image" content="https://0xsend.github.io/assets/2024/03/sendtag.png" />
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
