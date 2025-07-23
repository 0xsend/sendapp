import { CONTAINER_OFFSET } from 'apps-expo/components/layout/TabScreenContainer'
import { ActivityScreen } from 'app/features/activity/screen'
import { Container } from '@my/ui'
import { useTabBarSize } from 'apps-expo/utils/layout/useTabBarSize'

export default function ActivityTabScreen() {
  const { height } = useTabBarSize()

  return (
    <Container
      safeAreaProps={{
        edges: ['left', 'right'],
        style: { flex: 1 },
      }}
      flex={1}
      backgroundColor="$background"
      overflow={'hidden'}
      paddingBottom={CONTAINER_OFFSET + height}
      paddingHorizontal={0}
    >
      <ActivityScreen />
    </Container>
  )
}
