import '../public/reset.css'
import '../styles/globals.css'

import 'raf/polyfill'
import 'react-native-gesture-handler'
import 'react-native-reanimated'

import '@my/ui/src/config/fonts.css'

import { type ColorScheme, NextThemeProvider, useRootTheme } from '@tamagui/next-theme'

import { Provider } from 'app/provider'
import type { AuthProviderProps } from 'app/provider/auth'
import { api } from 'app/utils/api'
import type { NextPage } from 'next'
import { DefaultSeo } from 'next-seo'
import type { ReactElement, ReactNode } from 'react'
import type { SolitoAppProps } from 'solito'

import { defaultSEOConfig } from '../config/next-seo'
import Head from 'next/head'
import { NextSeo } from 'next-seo'
import type { buildSeo } from 'utils/seo'

if (process.env.NODE_ENV === 'production') {
  require('../public/tamagui.css')
}

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
  // reference: https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts
  const getLayout = Component.getLayout || ((page) => page)

  const [, setTheme] = useRootTheme()

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
        <Provider initialSession={pageProps.initialSession}>
          {getLayout(<Component {...pageProps} />)}
        </Provider>
      </NextThemeProvider>
    </>
  )
}

export default api.withTRPC(MyApp)
