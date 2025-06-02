import { Container, H4, Paragraph, Stack } from '@my/ui'
import { Stack as StackRouter } from 'expo-router'

export default function ActivityTabScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Activity',
          headerShown: false, // We'll use the header from the tabs layout
        }}
      />

      <Container
        safeAreaProps={{
          edges: ['left', 'right'],
          style: { flex: 1 },
        }}
        flex={1}
        backgroundColor="$background"
      >
        <Stack f={1} ai="center" jc="center" p="$4">
          <H4 mb="$4">Activity Feed</H4>
          <Paragraph ta="center" color="$color10">
            This screen will display your transaction history and account activity.
          </Paragraph>
        </Stack>
      </Container>
    </>
  )
}
