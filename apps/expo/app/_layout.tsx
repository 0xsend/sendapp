import type { Session } from '@supabase/supabase-js'
import { loadThemePromise, Provider } from 'app/provider'
import { supabase } from 'app/utils/supabase/client.native'
import { SplashScreen } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { LogBox, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import StackNavigator from 'apps-expo/components/layout/StackNavigator'
import { useFonts } from 'expo-font'
import { DMSans_400Regular, DMSans_700Bold } from '@expo-google-fonts/dm-sans'
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono'

SplashScreen.preventAutoHideAsync()

LogBox.ignoreLogs([
  'Cannot update a component',
  'You are setting the style',
  'No route',
  'duplicate ID',
  'Require cycle',
])

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'DM Sans': DMSans_400Regular,
    'DM Sans Bold': DMSans_700Bold,
    'DM Mono': DMMono_400Regular,
  })
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
    if (fontsLoaded && sessionLoadAttempted && themeLoaded) {
      // Only workaround I found on github issues or stack overflow that works
      // https://stackoverflow.com/questions/64780275/at-using-expo-after-splash-screen-blinkflash-with-white-screen
      await new Promise((resolve) => setTimeout(resolve, 0))
      await SplashScreen.hideAsync()
    }
  }, [fontsLoaded, sessionLoadAttempted, themeLoaded])

  if (!themeLoaded || !fontsLoaded || !sessionLoadAttempted) {
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
