import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { ActivityScreen } from 'app/features/activity/screen'

export default function ActivityTabScreen() {
  return (
    <>
      <TabScreenContainer>
        <ActivityScreen />
      </TabScreenContainer>
    </>
  )
}
