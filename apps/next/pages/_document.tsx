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
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
