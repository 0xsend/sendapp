import { useTheme, XStack } from '@my/ui'
import { Activity, DollarSign, Home } from '@tamagui/lucide-icons'
import { IconSendLogo } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { Stack, Tabs, Redirect } from 'expo-router'
import { useSafeAreaInsets } from '@my/ui'
import AvatarMenuButton from 'app/components/AvatarMenuButton/AvatarMenuButton'

export default function Layout() {
  const theme = useTheme()
  const accentColor = theme.color10
  const backgroundColor = theme.background || theme.color1

  const { session, profile } = useUser()
  const insets = useSafeAreaInsets()

  // Redirect to root if not logged in - this ensures the tabs layout is only shown for logged-in users
  if (!session) {
    return <Redirect href="/" />
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '/send',
          headerTitle: () => (
            <XStack ai="center" jc="flex-start" f={1}>
              <IconSendLogo size={'$2'} color={'$color12'} />
            </XStack>
          ),
          headerShown: true,
          headerShadowVisible: false,
          headerStyle: {
            backgroundColor: backgroundColor.val,
          },
          headerTintColor: accentColor.val,
          headerRight: () => <AvatarMenuButton profile={profile} />,
        }}
      />
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          headerShown: false, // Hide tab headers - use Stack.Screen header instead
          headerTintColor: accentColor.val,
          tabBarStyle: {
            paddingTop: 10,
            paddingBottom: insets.bottom + 10, // reduce bottom padding
            height: 60,
            alignContent: 'center',
            justifyContent: 'center',
            borderTopWidth: 1,
            borderTopColor: '$borderColor',
          },
          tabBarItemStyle: {
            paddingBottom: 10,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          key="index"
          options={{
            headerShown: false,
            title: 'Home',
            tabBarIcon: ({ size, color, focused }) => (
              <Home color={focused ? '$color12' : '$color10'} size={size} strokeWidth={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="activity"
          key="activity"
          options={{
            headerShown: false,
            title: 'Activity',
            tabBarIcon: ({ size, color, focused }) => (
              <Activity color={focused ? '$color12' : '$color10'} size={size} strokeWidth={2} />
            ),
          }}
        />

        <Tabs.Screen
          name="earn"
          key="earn"
          options={{
            headerShown: false,
            title: 'Earn',
            tabBarIcon: ({ size, color, focused }) => (
              <DollarSign color={focused ? '$color12' : '$color10'} size={size} strokeWidth={2} />
            ),
          }}
        />
      </Tabs>
    </>
  )
}
