import { Stack } from 'expo-router/build/layouts/Stack'
import { CONTAINER_OFFSET } from 'apps-expo/components/layout/ScreenContainer'
import FriendsScreen from 'app/features/affiliate/screen'
import { Container, useSafeAreaInsets } from '@my/ui'

export default function ReferralsScreen() {
  const insets = useSafeAreaInsets()

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Friends',
        }}
      />
      <Container
        safeAreaProps={{
          edges: ['left', 'right'],
          style: { flex: 1 },
        }}
        flex={1}
        backgroundColor="$background"
        overflow={'visible'}
        paddingTop={CONTAINER_OFFSET}
        paddingBottom={CONTAINER_OFFSET + insets.bottom}
      >
        <FriendsScreen />
      </Container>
    </>
  )
}
