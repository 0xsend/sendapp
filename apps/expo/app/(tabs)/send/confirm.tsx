import { Container } from '@my/ui'
import { SendConfirmScreen } from 'app/features/send/confirm/screen'

export default function SendConfirm() {
  return (
    <>
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
