import { Stack } from 'expo-router'
import { useTheme, XStack } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'

export default function AuthLayout() {
  const theme = useTheme()

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
            <XStack ai="center" jc="flex-start" f={1}>
              <IconSendLogo size={'$2'} color={'$color12'} />
            </XStack>
          ),
        }}
      />
    </>
  )
}
