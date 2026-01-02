import { Stack, useRouter } from 'expo-router'
import { config, Paragraph, useTheme, XStack } from '@my/ui'
import { useIsDarkTheme } from 'apps-expo/utils/layout/useIsDarkTheme'
import { Platform, Pressable } from 'react-native'
import { IconArrowLeft } from 'app/components/icons'
import { useMemo } from 'react'
import { usePageviewTracking } from 'app/analytics/usePageviewTracking'

export default function StackNavigator() {
  const theme = useTheme()
  const isDark = useIsDarkTheme()
  const router = useRouter()

  usePageviewTracking()

  const iosMajorVersion = useMemo(() => {
    if (Platform.OS !== 'ios') return null

    const versionString = Platform.Version.split('.')[0]

    if (!versionString) return null

    return Number.parseInt(versionString)
  }, [])

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: theme.background.val,
        },
        headerTintColor: isDark ? config.tokens.color.primary.val : theme.color12.val,
        headerLeft:
          Platform.OS === 'ios' && iosMajorVersion && iosMajorVersion > 18
            ? undefined
            : () => (
                <Pressable onPress={() => router.back()}>
                  <IconArrowLeft
                    size={'$1.5'}
                    color={isDark ? '$primary' : '$color12'}
                    $platform-ios={{ marginLeft: 6 }}
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
        // Performance optimizations for Android
        animation: 'slide_from_right',
        animationDuration: Platform.OS === 'android' ? 150 : undefined,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        // Enable native stack optimizations
        freezeOnBlur: true,
      }}
    />
  )
}
