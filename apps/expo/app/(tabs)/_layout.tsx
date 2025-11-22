import { Paragraph, useTheme, XStack } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { Redirect, Stack, Tabs, useFocusEffect } from 'expo-router'
import AvatarMenuButton from 'app/components/AvatarMenuButton/AvatarMenuButton'
import { HeaderSlot } from 'apps-expo/components/layout/HeaderSlot'
import BottomNavBar from 'app/components/BottomTabBar/BottomNavBar'
import type { NavigationState, PartialState, Route } from '@react-navigation/native'
import { useCallback, type ReactNode } from 'react'
import * as NavigationBar from 'expo-navigation-bar'
import { useColorScheme } from 'react-native'
import { useTranslation } from 'react-i18next'

type TabConfig = {
  key: string
  renderHeader?: () => ReactNode
  labelKey?: string
}

const TABS: TabConfig[] = [
  {
    key: 'home/index',
    renderHeader: () => (
      <XStack ai="center" jc="flex-start">
        <IconSendLogo size={'$2'} color={'$color12'} />
      </XStack>
    ),
    labelKey: 'tabs.home',
  },
  {
    key: 'activity/index',
    labelKey: 'tabs.activity',
  },
  {
    key: 'send/index',
    labelKey: 'tabs.send',
  },
  {
    key: 'explore/index',
    labelKey: 'tabs.explore',
  },
]

function getActiveTabName(state: NavigationState | PartialState<NavigationState>): string {
  const route = state.routes[state.index ?? 0] as Route<string> & {
    state?: NavigationState | PartialState<NavigationState>
  }

  if (route.state) {
    return getActiveTabName(route.state)
  }

  return route.name
}

export default function Layout() {
  const theme = useTheme()
  const { session, profile } = useUser()
  const scheme = useColorScheme()
  const { t } = useTranslation('navigation')

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

  // Redirect to root if not logged in - this ensures the tabs layout is only shown for logged-in users
  if (!session) {
    return <Redirect href="/" />
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <Tabs
        tabBar={(props) => <BottomNavBar currentRoute={getActiveTabName(props.state)} />}
        screenOptions={{
          freezeOnBlur: true,
          headerStyle: {
            backgroundColor: theme.background.val,
          },
          headerShadowVisible: false,
          headerTintColor: theme.color12.val,
        }}
      >
        {TABS.map((tab) => {
          return (
            <Tabs.Screen
              name={tab.key}
              key={tab.key}
              options={{
                headerLeft: () => {
                  if (tab.renderHeader) {
                    return <HeaderSlot>{tab.renderHeader()}</HeaderSlot>
                  }

                  if (tab.labelKey) {
                    return (
                      <HeaderSlot>
                        <Paragraph
                          fontWeight={'600'}
                          fontSize={'$8'}
                          col="$color12"
                          lineHeight={32}
                        >
                          {t(tab.labelKey)}
                        </Paragraph>
                      </HeaderSlot>
                    )
                  }

                  return null
                },
                headerTitle: () => null,
                headerRight: () => (
                  <HeaderSlot>
                    <AvatarMenuButton profile={profile} />
                  </HeaderSlot>
                ),
              }}
            />
          )
        })}
      </Tabs>
    </>
  )
}
