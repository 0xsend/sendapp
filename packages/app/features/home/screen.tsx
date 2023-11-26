import { createPasskey, signWithPasskey } from '@daimo/expo-passkeys'
import { Button, Container, H1, YStack } from '@my/ui'

export function HomeScreen() {
  return (
    <Container>
      <H1>Home</H1>
      <YStack space="$4">
        <H1>Sign In</H1>
        <Button
          onPress={async () => {
            const result = await createPasskey({
              domain: 'sendapp.localhost',
              challengeB64: window.btoa('some challenge'),
              passkeyName: 'sendappuser',
              passkeyDisplayTitle: 'SendAppUser',
            })
            // @ts-expect-error - for debugging
            window.passkey = result
            console.log(result)
          }}
        >
          Create
        </Button>
        <Button
          onPress={async () => {
            const sign = await signWithPasskey({
              domain: 'sendapp.localhost',
              challengeB64: window.btoa('another challenge'),
            })
            // @ts-expect-error - for debugging
            window.sign = sign
            console.log(sign)
          }}
        >
          Sign
        </Button>
      </YStack>
    </Container>
  )
}
