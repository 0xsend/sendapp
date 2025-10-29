import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { ExploreScreen } from 'app/features/explore/screen'

export default function Screen() {
  return (
    <TabScreenContainer>
      <ExploreScreen
        images={{
          rewards: 'https://ghassets.send.app/app_images/explore_rewards_2.jpeg',
          cantonWallet: 'https://ghassets.send.app/app_images/explore_canton_2.jpeg',
        }}
      />
    </TabScreenContainer>
  )
}
