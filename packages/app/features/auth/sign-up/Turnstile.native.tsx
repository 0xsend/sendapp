import type { TurnstileProps } from '@marsidev/react-turnstile'
import { View } from 'react-native'
import { WebView } from 'react-native-webview'

export const Turnstile = (props: TurnstileProps) => {
  return (
    <View style={{ backgroundColor: 'transparent', width: 300, maxWidth: 320, height: 100 }}>
      <WebView
        style={{
          flex: 1,
          backgroundColor: 'transparent',
        }}
        originWhitelist={['*']}
        source={{
          html: `
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
              <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
            </head>
            <body style="margin: 0; padding: 0;">
              <script>
                function callback(token) {
                  window.ReactNativeWebView.postMessage(token)
                }
              </script>
              <div
                class="cf-turnstile"
                data-sitekey="${process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}"
                data-callback="callback"
                data-size="flexible"
              ></div>
            </body>
          </html>`,
        }}
        onMessage={({ nativeEvent }) => {
          console.log('message', nativeEvent)
          props.onSuccess?.(nativeEvent.data)
        }}
      />
    </View>
  )
}
