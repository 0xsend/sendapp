import { Paragraph, useTheme, XStack } from '@my/ui'

import {
  IconArrowUp,
  IconDeviceReset,
  IconHome,
  IconSendLogo,
  IconWorldSearch,
} from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { Redirect, Stack, Tabs, useRouter } from 'expo-router'
import AvatarMenuButton from 'app/components/AvatarMenuButton/AvatarMenuButton'
import { useScrollDirection } from 'app/provider/scroll/ScrollDirectionContext'
import { Animated } from 'react-native'
import { useEffect, useRef } from 'react'
import { useTabBarSize } from 'apps-expo/utils/layout/useTabBarSize'
import { useHighlightColor } from 'apps-expo/utils/layout/useHighlightColor'
import { HeaderSlot } from 'apps-expo/components/layout/HeaderSlot'
import { baseMainnet, sendTokenAddress } from '@my/wagmi'

const TABS = [
  {
    Icon: IconHome,
    key: 'index',
    title: () => (
      <XStack ai="center" jc="flex-start" f={1}>
        <IconSendLogo size={'$2'} color={'$color12'} />
      </XStack>
    ),
  },
  {
    Icon: IconArrowUp,
    key: 'send/index',
    title: 'Send',
  },
  {
    Icon: IconWorldSearch,
    key: 'explore/index',
    title: 'Explore',
  },
  {
    Icon: IconDeviceReset,
    key: 'activity/index',
    title: 'Activity',
  },
]

export default function Layout() {
  const theme = useTheme()
  const { direction } = useScrollDirection()
  const { session, profile } = useUser()
  const { height, padding } = useTabBarSize()
  const translateY = useRef(new Animated.Value(0)).current
  const highlightColor = useHighlightColor()
  const router = useRouter()

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
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Tabs
        screenOptions={{
          tabBarShowLabel: false,
          headerStyle: {
            backgroundColor: theme.background.val,
          },
          headerShadowVisible: false,
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
                headerLeft: () => {
                  if (typeof tab.title === 'string') {
                    return (
                      <HeaderSlot>
                        <Paragraph
                          fontWeight={'300'}
                          fontSize={'$8'}
                          col="$color10"
                          lineHeight={32}
                        >
                          {tab.title}
                        </Paragraph>
                      </HeaderSlot>
                    )
                  }

                  return <HeaderSlot>{tab.title()}</HeaderSlot>
                },
                headerTitle: () => null,
                headerRight: () => (
                  <HeaderSlot>
                    <AvatarMenuButton profile={profile} />
                  </HeaderSlot>
                ),
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
              listeners={{
                tabPress: (e) => {
                  if (tab.key !== 'send/index') {
                    return
                  }
                  e.preventDefault()
                  router.push(
                    `/send?${new URLSearchParams({ sendToken: sendTokenAddress[baseMainnet.id] })}`
                  )
                },
              }}
            />
          )
        })}
      </Tabs>
    </>
  )
}
