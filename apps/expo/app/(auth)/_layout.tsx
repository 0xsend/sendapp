import { Stack, useFocusEffect } from 'expo-router'
import { useTheme, XStack } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { useColorScheme } from 'react-native'
import { useCallback } from 'react'
import * as NavigationBar from 'expo-navigation-bar'

export default function AuthLayout() {
  const theme = useTheme()
  const scheme = useColorScheme()

  useFocusEffect(
    useCallback(() => {
      if (scheme === 'dark') {
        setTimeout(() => {
          void NavigationBar.setBackgroundColorAsync('#081619')
        }, 0)
      } else {
        setTimeout(() => {
          void NavigationBar.setBackgroundColorAsync('#f7f7f7')
        }, 0)
      }
    }, [scheme])
  )

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: theme.color12.val,
          headerBackVisible: false,
          headerStyle: {
            backgroundColor: theme.background.val,
          },
          headerTitle: () => (
            <XStack ai="center" jc="center" f={1} mt={'$2'}>
              <IconSendLogo size={'$3'} color={'$color12'} />
            </XStack>
          ),
        }}
      />
    </>
  )
}
