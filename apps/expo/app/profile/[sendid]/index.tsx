import { CONTAINER_OFFSET } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { ProfileScreen } from 'app/features/profile/screen'
import { Container, useSafeAreaInsets } from '@my/ui'

export default function Screen() {
  const insets = useSafeAreaInsets()

  return (
    <>
      <Stack.Screen
        options={{
          title: 'History',
        }}
      />
      <Container
        safeAreaProps={{
          edges: ['left', 'right'],
          style: { flex: 1 },
        }}
        flex={1}
        backgroundColor="$background"
        paddingTop={CONTAINER_OFFSET}
        paddingBottom={insets.bottom}
      >
        <ProfileScreen />
      </Container>
    </>
  )
}
