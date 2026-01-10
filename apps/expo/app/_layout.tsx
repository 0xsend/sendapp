// Expo Intl backfills, order matter
// 1. Canonical locales (foundation)
import '@formatjs/intl-getcanonicallocales/polyfill'

// 2. Locale (needed by other polyfills)
import '@formatjs/intl-locale/polyfill'

// 3. PluralRules (required by RelativeTimeFormat)
import '@formatjs/intl-pluralrules/polyfill'
import '@formatjs/intl-pluralrules/locale-data/en' // English
import '@formatjs/intl-pluralrules/locale-data/de' // German
import '@formatjs/intl-pluralrules/locale-data/es' // Spanish
import '@formatjs/intl-pluralrules/locale-data/zh' // Chinese
// 4. RelativeTimeFormat (depends on above)
import '@formatjs/intl-relativetimeformat/polyfill'
import '@formatjs/intl-relativetimeformat/locale-data/en' // English
import '@formatjs/intl-relativetimeformat/locale-data/de' // German
import '@formatjs/intl-relativetimeformat/locale-data/es' // Spanish
import '@formatjs/intl-relativetimeformat/locale-data/zh' // Chinese

import 'intl-pluralrules'

// Configure push notifications handler (must be before any notification imports)
import { configureNotificationHandler } from 'app/utils/useNotifications'
configureNotificationHandler()
import type { Session } from '@supabase/supabase-js'
import { AnalyticsErrorBoundary, ErrorFallback } from 'app/components/ErrorBoundary'
import { loadThemePromise, Provider } from 'app/provider'
import { getI18n, initSharedI18n } from 'app/i18n'
import { supabase } from 'app/utils/supabase/client.native'
import { SplashScreen } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { LogBox, useColorScheme, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import StackNavigator from 'apps-expo/components/layout/StackNavigator'
import { useFonts } from 'expo-font'
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans'
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono'
import * as SystemUI from 'expo-system-ui'
import { NotificationPermissionPrompt } from 'app/components/NotificationPermissionPrompt'
import {
  initializeNotificationConfig,
  useNotificationHandler,
} from 'app/hooks/useNotificationHandler'

SplashScreen.preventAutoHideAsync()

LogBox.ignoreLogs([
  'Cannot update a component',
  'You are setting the style',
  'No route',
  'duplicate ID',
  'Require cycle',
])

export default function RootLayout() {
  useNotificationHandler()

  const [fontsLoaded] = useFonts({
    'DM Sans': DMSans_400Regular,
    'DM Sans Medium': DMSans_500Medium,
    'DM Sans SemiBold': DMSans_600SemiBold,
    'DM Sans Bold': DMSans_700Bold,
    'DM Mono': DMMono_400Regular,
  })
  const [themeLoaded, setThemeLoaded] = useState(false)
  const [sessionLoadAttempted, setSessionLoadAttempted] = useState(false)
  const [initialSession, setInitialSession] = useState<Session | null>(null)
  const [i18nReady, setI18nReady] = useState(false)
  const scheme = useColorScheme()

  useEffect(() => {
    if (scheme === 'dark') {
      void SystemUI.setBackgroundColorAsync('#081619')
    } else {
      void SystemUI.setBackgroundColorAsync('#f7f7f7')
    }
  }, [scheme])

  useEffect(() => {
    void initializeNotificationConfig()
  }, [])

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data) {
          setInitialSession(data.session)
        }
      })
      .finally(() => {
        setSessionLoadAttempted(true)
      })
  }, [])

  useEffect(() => {
    loadThemePromise.then(() => {
      setThemeLoaded(true)
    })
  }, [])

  useEffect(() => {
    initSharedI18n()
      .then(() => {
        setI18nReady(true)
      })
      .catch((error) => {
        console.error('[i18n] failed to initialize', error)
        setI18nReady(true)
      })
  }, [])

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded && sessionLoadAttempted && themeLoaded && i18nReady) {
      // Only workaround I found on github issues or stack overflow that works
      // https://stackoverflow.com/questions/64780275/at-using-expo-after-splash-screen-blinkflash-with-white-screen
      await new Promise((resolve) => setTimeout(resolve, 0))
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded, sessionLoadAttempted, themeLoaded, i18nReady])

  if (!themeLoaded || !fontsLoaded || !sessionLoadAttempted || !i18nReady) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Provider initialSession={initialSession} i18n={getI18n()}>
          <AnalyticsErrorBoundary
            componentName="AppRoot"
            fallback={({ error, resetError }) => (
              <ErrorFallback error={error} resetError={resetError} />
            )}
          >
            <StackNavigator />
            <NotificationPermissionPrompt delayMs={5000} />
          </AnalyticsErrorBoundary>
        </Provider>
      </View>
    </GestureHandlerRootView>
  )
}
