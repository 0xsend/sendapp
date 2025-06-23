import { HomeScreen } from 'app/features/home/screen'
import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'

export default function HomeTabScreen() {
  return (
    <TabScreenContainer>
      <SendEarnProvider>
        <HomeScreen />
      </SendEarnProvider>
    </TabScreenContainer>
  )
}
