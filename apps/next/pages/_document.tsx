import NextDocument, {
  type DocumentContext,
  type DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document'
import { Children } from 'react'
import { AppRegistry } from 'react-native'

import { config } from '@my/ui'

const DEV = process.env.NODE_ENV === 'development'

export default class Document extends NextDocument {
  static async getInitialProps(ctx: DocumentContext): Promise<DocumentInitialProps> {
    AppRegistry.registerComponent('Main', () => Main)
    const page = await ctx.renderPage()

    // @ts-expect-error: getApplication is not in the types
    const { getStyleElement } = AppRegistry.getApplication('Main')

    /**
     * Note: be sure to keep tamagui styles after react-native-web styles like it is here!
     * So Tamagui styles can override the react-native-web styles.
     */
    const styles = [
      getStyleElement(),
      <style
        key="tamagui-css"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: tamagui is a trusted source
        dangerouslySetInnerHTML={{
          __html: config.getCSS({
            exclude: DEV ? null : 'design-system',
          }),
        }}
      />,
    ]

    return { ...page, styles: Children.toArray(styles) }
  }

  render() {
    return (
      <Html>
        <Head>
          {DEV && !!process.env.NEXT_PUBLIC_REACT_SCAN_ENABLED ? (
            <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
          ) : null}
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
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
          <link rel="stylesheet" href="/tamagui.css" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
