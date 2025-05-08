import { Button, Container, H4, Paragraph, Stack, YStack } from '@my/ui'
import { Stack as StackRouter, useRouter } from 'expo-router'

export default function SendPotScreen() {
  const router = useRouter()

  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'SendPot',
          headerShown: true,
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
        <YStack f={1} ai="center" jc="center" p="$4" gap="$6">
          <H4>SendPot</H4>
          <Paragraph ta="center" color="$color10">
            SendPot is a lottery system where you can win prizes by purchasing tickets.
          </Paragraph>

          <Button
            size="$4"
            theme="green"
            onPress={() => {
              router.push('/sendpot/buy-tickets')
            }}
          >
            Buy Tickets
          </Button>
        </YStack>
      </Container>
    </>
  )
}
