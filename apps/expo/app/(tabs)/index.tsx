import { HomeScreen } from 'app/features/home/screen'
import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { useCallback } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'

export default function HomeTabScreen() {
  const router = useRouter()

  useFocusEffect(
    useCallback(() => {
      router.dismissAll()
      router.replace('/(tabs)/')
    }, [router.dismissAll, router.replace])
  )

  return (
    <TabScreenContainer>
      <SendEarnProvider>
        <HomeScreen />
      </SendEarnProvider>
    </TabScreenContainer>
  )
}
