import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { ExploreScreen } from 'app/features/explore/screen'

export default function Screen() {
  return (
    <>
      <TabScreenContainer>
        <ExploreScreen
          images={{
            rewards: require('../../../assets/images/explore_rewards.jpg'),
            feed: require('../../../assets/images/feed.jpg'),
          }}
        />
      </TabScreenContainer>
    </>
  )
}
