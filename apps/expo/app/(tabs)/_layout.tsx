import { Paragraph, useTheme, XStack } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { useUser } from 'app/utils/useUser'
import { Redirect, Stack, Tabs } from 'expo-router'
import AvatarMenuButton from 'app/components/AvatarMenuButton/AvatarMenuButton'
import { HeaderSlot } from 'apps-expo/components/layout/HeaderSlot'
import BottomNavBar from 'app/components/BottomTabBar/BottomNavBar'
import type { NavigationState, PartialState, Route } from '@react-navigation/native'

const TABS = [
  {
    key: 'index',
    title: () => (
      <XStack ai="center" jc="flex-start">
        <IconSendLogo size={'$2'} color={'$color12'} />
      </XStack>
    ),
  },
  {
    key: 'send/index',
    title: 'Send',
  },
  {
    key: 'activity/index',
    title: 'Activity',
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
                  if (typeof tab.title === 'string') {
                    return (
                      <HeaderSlot>
                        <Paragraph
                          fontWeight={'600'}
                          fontSize={'$8'}
                          col="$color12"
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
              }}
            />
          )
        })}
      </Tabs>
    </>
  )
}
