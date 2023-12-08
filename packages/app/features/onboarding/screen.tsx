import {
  type CreateResult,
  type SignResult,
  createPasskey,
  signWithPasskey,
} from '@daimo/expo-passkeys'
import { Button, Container, H1, H2, Paragraph, YStack } from '@my/ui'
import { useState } from 'react'

export function OnboardingScreen() {
  const [createResult, setCreateResult] = useState<CreateResult | null>(null)
  const [signResult, setSignResult] = useState<SignResult | null>(null)
  return (
    <Container>
      <YStack space="$4" maxWidth={600}>
        <H1>Welcome to Send</H1>
        <H2>Start by creating a Passkey below</H2>
        <Button
          onPress={async () => {
            const result = await createPasskey({
              domain: 'sendapp.localhost',
              challengeB64: window.btoa('some challenge'),
              passkeyName: 'sendappuser',
              passkeyDisplayTitle: 'SendAppUser',
            })
            console.log(result)
            setCreateResult(result)
          }}
        >
          Create
        </Button>
        <Paragraph fontFamily={'monospace'}>
          {createResult ? JSON.stringify(createResult, null, 2) : null}
        </Paragraph>
        <H2>Then sign a message with it</H2>
        <Button
          onPress={async () => {
            const sign = await signWithPasskey({
              domain: 'sendapp.localhost',
              challengeB64: window.btoa('another challenge'),
            })
            console.log(sign)
            setSignResult(sign)
          }}
        >
          Sign
        </Button>
      </YStack>
    </Container>
  )
}
