import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { ExploreScreen } from 'app/features/explore/screen'

export default function Screen() {
  return (
    <>
      <TabScreenContainer>
        <ExploreScreen />
      </TabScreenContainer>
    </>
  )
}
