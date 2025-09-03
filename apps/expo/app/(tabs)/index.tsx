import { HomeScreen } from 'app/features/home/screen'
import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { useEffect } from 'react'
import { useRootNavigationState, useRouter } from 'expo-router'

export default function HomeTabScreen() {
  const router = useRouter()
  const rootNavigationState = useRootNavigationState()

  useEffect(() => {
    const routes: string[] =
      rootNavigationState.routes?.map((route: { name: string }) => route.name) || []

    if (routes[0] !== '(tabs)') {
      router.dismissAll()
      router.replace('/(tabs)/')
    }
  }, [router.dismissAll, router.replace, rootNavigationState.routes])

  return (
    <TabScreenContainer>
      <SendEarnProvider>
        <HomeScreen />
      </SendEarnProvider>
    </TabScreenContainer>
  )
}
