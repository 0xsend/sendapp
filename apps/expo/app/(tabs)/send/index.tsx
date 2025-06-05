import { SendScreen as SendMainScreen } from 'app/features/send/screen'
import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'

export default function SendScreen() {
  return (
    <TabScreenContainer>
      <SendMainScreen />
    </TabScreenContainer>
  )
}
