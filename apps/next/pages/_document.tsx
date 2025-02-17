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

const SAFE_AREA_SCRIPT = `
  (function() {
    const root = document.documentElement;
    const safeAreas = {
      '--sat': 'env(safe-area-inset-top)',
      '--sar': 'env(safe-area-inset-right)',
      '--sab': 'env(safe-area-inset-bottom)',
      '--sal': 'env(safe-area-inset-left)',
    };

    Object.entries(safeAreas).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  })();
`

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
            exclude: process.env.NODE_ENV === 'development' ? null : 'design-system',
          }),
        }}
      />,
    ]

    return { ...page, styles: Children.toArray(styles) }
  }

  render() {
    return (
      <Html style={{ height: 'calc(100vh - (100vh - 100%))', backgroundColor: 'transparent' }}>
        <Head>
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <script
            // biome-ignore lint/security/noDangerouslySetInnerHtml: safe area script is static
            dangerouslySetInnerHTML={{ __html: SAFE_AREA_SCRIPT }}
          />
        </Head>
        <body
          style={{
            height: 'calc(100vh - (100vh - 100%))',
          }}
        >
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
