import { SendScreen as SendMainScreen } from 'app/features/send/screen'
import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { useClearSendParamsOnBlur } from 'apps-expo/utils/useClearSendParamsOnBlur'

export default function SendScreen() {
  useClearSendParamsOnBlur()

  return (
    <TabScreenContainer>
      <SendMainScreen />
    </TabScreenContainer>
  )
}
