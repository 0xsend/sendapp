import { Container } from '@my/ui'
import { SendScreen as SendMainScreen } from 'app/features/send/screen'
import { Stack } from 'expo-router'
import { configureScreenHeader } from 'apps-expo/utils/configureScreenHeader'

export default function SendScreen() {
  return (
    <>
      <Stack.Screen
        options={configureScreenHeader({
          title: 'Send',
          showBack: true,
        })}
      />

      <Container
        safeAreaProps={{
          edges: ['bottom', 'left', 'right'],
          style: { flex: 1 },
        }}
        flex={1}
        backgroundColor="$background"
      >
        <SendMainScreen />
      </Container>
    </>
  )
}
