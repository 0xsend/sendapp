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
import { YStack, H1, H2 } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { SendV0TokenUpgradeScreen } from 'app/features/send-token-upgrade/screen'

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
          content="With a primary focus on enabling seamless USDC (USD Coin) transfers, Send offers scalability, global accessibility, and cost-effectiveness for both merchants and consumers."
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
        <meta property="og:image" content="https://ghassets.send.app/2024/04/send-og-image.png" />
      </Head>
      <NextThemeProvider
        onChangeTheme={(next) => {
          setTheme(next as ColorScheme)
        }}
      >
        <Provider initialSession={pageProps.initialSession}>
          {/* TODO: create a concerns screen or move to provider instead of wrapping here in next app */}
          <MaintenanceMode>
            <SendV0TokenUpgradeScreen>
              {getLayout(<Component {...pageProps} />)}
            </SendV0TokenUpgradeScreen>
          </MaintenanceMode>
        </Provider>
      </NextThemeProvider>
    </>
  )
}

export default api.withTRPC(MyApp)

function MaintenanceMode({ children }: { children: ReactNode }) {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true') {
    return (
      <YStack
        p="$4"
        ai="center"
        jc="center"
        w="100%"
        h="100%"
        $gtMd={{
          p: '$6',
          ai: 'flex-start',
          jc: 'flex-start',
        }}
      >
        <IconSendLogo size={'$2.5'} color="$color12" />
        <H1 $gtMd={{ size: '$8' }} size="$4" fontWeight={'300'} color="$color12">
          currently undergoing maintenance
        </H1>
        <H2 $gtMd={{ size: '$6' }} size="$4" fontWeight={'300'} color="$color12">
          We will be back shortly!
        </H2>
      </YStack>
    )
  }
  return children
}
