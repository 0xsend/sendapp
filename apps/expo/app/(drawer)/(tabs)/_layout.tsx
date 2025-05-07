import { Button, useTheme, XStack } from '@my/ui'
import { DrawerActions } from '@react-navigation/native'
import { Home, Menu, Plus, User } from '@tamagui/lucide-icons'
import { IconSendLogo } from 'app/components/icons'
import { router, Stack, Tabs, useNavigation, usePathname } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function Layout() {
  const theme = useTheme()
  const accentColor = theme.color10
  const navigation = useNavigation()
  const pathname = usePathname()
  const insets = useSafeAreaInsets()

  if (__DEV__) {
    console.log('pathname', pathname)
  }
  return (
    <>
      <Stack.Screen
        options={{
          title: '/send',
          headerTitle: () => (
            <XStack ai="center" jc="center">
              <IconSendLogo size={'$2'} color={'$color12'} />
            </XStack>
          ),
          headerShown: true,
          headerShadowVisible: false,
          headerTitleAlign: 'center',
          headerStyle: {},
          headerTintColor: accentColor.val,

          headerLeft: () => (
            <Button
              borderStyle="unset"
              borderWidth={0}
              backgroundColor="transparent"
              marginLeft="$-1"
              paddingHorizontal="$4"
              onPress={() => {
                navigation.dispatch(DrawerActions.openDrawer())
              }}
            >
              <Menu size={24} />
            </Button>
          ),
          headerRight: () => (
            <Button
              borderStyle="unset"
              borderWidth={0}
              marginRight="$-1"
              backgroundColor="transparent"
              onPress={() => {
                router.navigate('create')
              }}
            >
              <Plus size={24} />
            </Button>
          ),
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
          name="profile"
          key="profile"
          options={{
            headerShown: false,
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ size, color, focused }) => (
              <User color={focused ? '$color12' : '$color10'} size={size} strokeWidth={2} />
            ),
          }}
        />
      </Tabs>
    </>
  )
}
