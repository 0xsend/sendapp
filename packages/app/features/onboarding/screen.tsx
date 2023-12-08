/**
 * Onboarding screen will ultimately be the first screen a user sees when they open the app or after they sign up.
 *
 * It needs to:
 * - Introduce to Send
 * - Create a passkey
 * - Generate a deterministic address from the public key
 * - Ask the user to deposit funds
 */
import {
  type CreateResult,
  type SignResult,
  createPasskey,
  signWithPasskey,
} from '@daimo/expo-passkeys'
import { Button, Container, H1, H2, TextArea, YStack } from '@my/ui'
import React, { useState } from 'react'

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
        <TextArea
          height="$16"
          fontFamily={'monospace'}
          value={createResult ? JSON.stringify(createResult, null, 2) : undefined}
        />
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
        <TextArea
          height="$16"
          fontFamily={'monospace'}
          value={signResult ? JSON.stringify(signResult, null, 2) : undefined}
        />
      </YStack>
    </Container>
  )
}
