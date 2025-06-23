import type { Session } from '@supabase/supabase-js'
import { loadThemePromise, Provider } from 'app/provider'
import { supabase } from 'app/utils/supabase/client.native'
import { SplashScreen } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { LogBox, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import StackNavigator from 'apps-expo/components/layout/StackNavigator'

SplashScreen.preventAutoHideAsync()

LogBox.ignoreLogs([
  'Cannot update a component',
  'You are setting the style',
  'No route',
  'duplicate ID',
  'Require cycle',
])

export default function RootLayout() {
  // TODO: use fonts
  // const [fontLoaded] = useFonts({
  //   'DM Sans': require('@tamagui/font-dm-sans/fonts/static/DMSans-Medium.ttf'),
  //   'DM Sans Bold': require('@tamagui/font-dm-sans/fonts/static/DMSans-Bold.ttf'),
  // })
  const [fontLoaded] = useState(true)
  const [themeLoaded, setThemeLoaded] = useState(false)
  const [sessionLoadAttempted, setSessionLoadAttempted] = useState(false)
  const [initialSession, setInitialSession] = useState<Session | null>(null)

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

  const onLayoutRootView = useCallback(async () => {
    if (fontLoaded && sessionLoadAttempted && themeLoaded) {
      // Only workaround I found on github issues or stack overflow that works
      // https://stackoverflow.com/questions/64780275/at-using-expo-after-splash-screen-blinkflash-with-white-screen
      await new Promise((resolve) => setTimeout(resolve, 0))
      await SplashScreen.hideAsync()
    }
  }, [fontLoaded, sessionLoadAttempted, themeLoaded])

  if (!themeLoaded || !fontLoaded || !sessionLoadAttempted) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Provider initialSession={initialSession}>
          <StackNavigator />
        </Provider>
      </View>
    </GestureHandlerRootView>
  )
}
