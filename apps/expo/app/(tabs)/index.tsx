import { HomeScreen } from 'app/features/home/screen'
import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'

export default function HomeTabScreen() {
  return (
    <TabScreenContainer>
      <HomeScreen />
    </TabScreenContainer>
  )
}
