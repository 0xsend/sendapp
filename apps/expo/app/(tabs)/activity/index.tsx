import { ActivityScreen } from 'app/features/activity/screen'
import { Container } from '@my/ui'
import { useTabBarSize } from 'app/components/BottomTabBar/useTabBarSize'
import { useClearSendParamsOnBlur } from 'apps-expo/utils/useClearSendParamsOnBlur'

export default function ActivityTabScreen() {
  const { height } = useTabBarSize()
  useClearSendParamsOnBlur()

  return (
    <Container
      safeAreaProps={{
        edges: ['left', 'right'],
        style: { flex: 1 },
      }}
      flex={1}
      backgroundColor="$background"
      overflow={'hidden'}
      paddingBottom={height}
      paddingHorizontal={0}
    >
      <ActivityScreen />
    </Container>
  )
}
