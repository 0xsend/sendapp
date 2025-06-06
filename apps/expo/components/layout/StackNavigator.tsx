import { Stack } from 'expo-router'
import { config, Paragraph, useTheme, XStack } from '@my/ui'
import { useIsDarkTheme } from 'apps-expo/utils/layout/useIsDarkTheme'

export default function StackNavigator() {
  const theme = useTheme()
  const isDark = useIsDarkTheme()

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.background.val,
        },
        headerTintColor: isDark ? config.tokens.color.primary.val : theme.color12.val,
        headerTitle: ({ children }) => (
          <XStack f={1} ai="center" jc="flex-start">
            <Paragraph fontWeight={'300'} fontSize={'$8'} col="$color10" lineHeight={32}>
              {children}
            </Paragraph>
          </XStack>
        ),
      }}
    />
  )
}
