import { useTheme, XStack } from '@my/ui'

import {
  IconArrowUp,
  IconDeviceReset,
  IconHome,
  IconSendLogo,
  IconWorldSearch,
} from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { Redirect, Stack, Tabs } from 'expo-router'
import AvatarMenuButton from 'app/components/AvatarMenuButton/AvatarMenuButton'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { Animated } from 'react-native'
import { useEffect, useRef } from 'react'
import { useTabBarSize } from 'apps-expo/utils/layout/useTabBarSize'
import { useHighlightColor } from 'apps-expo/utils/layout/useHighlightColor'

const TABS = [
  {
    Icon: IconHome,
    key: 'index',
  },
  {
    Icon: IconArrowUp,
    key: 'send',
  },
  {
    Icon: IconWorldSearch,
    key: 'explore',
  },
  {
    Icon: IconDeviceReset,
    key: 'activity',
  },
]

export default function Layout() {
  const theme = useTheme()
  const { direction } = useScrollDirection()
  const { session, profile } = useUser()
  const { height, padding } = useTabBarSize()
  const translateY = useRef(new Animated.Value(0)).current
  const highlightColor = useHighlightColor()

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: direction === 'down' ? height : 0,
      duration: 250,
      useNativeDriver: true,
    }).start()
  }, [direction, height, translateY])

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
            backgroundColor: theme.background.val,
          },
          headerTintColor: theme.color12.val,
          headerRight: () => <AvatarMenuButton profile={profile} />,
        }}
      />
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          headerShown: false, // Hide tab headers - use Stack.Screen header instead
          headerTintColor: theme.color12.val,
          tabBarStyle: {
            position: 'absolute',
            transform: [{ translateY }],
            paddingTop: padding,
            paddingBottom: padding,
            height,
            borderTopWidth: 1,
            backgroundColor: theme.color1.val,
          },
        }}
      >
        {TABS.map((tab) => {
          return (
            <Tabs.Screen
              name={tab.key}
              key={tab.key}
              options={{
                headerShown: false,
                tabBarIcon: ({ focused }) => (
                  <XStack
                    p={'$2'}
                    br={'$3'}
                    backgroundColor={focused ? highlightColor : 'transparent'}
                  >
                    <tab.Icon
                      size={'$1.5'}
                      color={focused ? '$primary' : '$silverChalice'}
                      $theme-light={{ color: focused ? '$color12' : '$darkGrayTextField' }}
                    />
                  </XStack>
                ),
              }}
            />
          )
        })}
      </Tabs>
    </>
  )
}
