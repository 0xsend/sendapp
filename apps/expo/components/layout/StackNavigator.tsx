import { Stack, useRouter } from 'expo-router'
import { config, Paragraph, useTheme, XStack } from '@my/ui'
import { useIsDarkTheme } from 'apps-expo/utils/layout/useIsDarkTheme'
import { Platform, Pressable } from 'react-native'
import { IconArrowLeft } from 'app/components/icons'

export default function StackNavigator() {
  const theme = useTheme()
  const isDark = useIsDarkTheme()
  const router = useRouter()

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.background.val,
        },
        headerTintColor: isDark ? config.tokens.color.primary.val : theme.color12.val,
        headerLeft: () => (
          <Pressable onPress={() => router.back()}>
            <IconArrowLeft
              size={'$1.5'}
              color={isDark ? config.tokens.color.primary.val : theme.color12.val}
            />
          </Pressable>
        ),
        headerTitleAlign: 'left',
        headerTitle: ({ children }) => (
          <XStack flex={1} ai="center" jc="flex-start" pl={Platform.OS === 'android' ? '$2' : 0}>
            <Paragraph
              fontWeight="600"
              ml={'$1'}
              fontSize="$8"
              color="$color10"
              lineHeight={32}
              numberOfLines={1}
            >
              {children}
            </Paragraph>
          </XStack>
        ),
      }}
    />
  )
}
