import { Container } from '@my/ui'
import { SendConfirmScreen } from 'app/features/send/confirm/screen'
import { Stack } from 'expo-router'
import { configureScreenHeader } from 'apps-expo/utils/configureScreenHeader'

export default function SendConfirm() {
  return (
    <>
      <Stack.Screen
        options={configureScreenHeader({
          title: 'Confirm Send',
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
        <SendConfirmScreen />
      </Container>
    </>
  )
}
