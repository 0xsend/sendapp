// sign-in-form.tsx
import {
  ButtonText,
  BigHeading,
  Paragraph,
  SubmitButton,
  YStack,
  H3,
  useToastController,
} from '@my/ui'
import { useState } from 'react'
import { useRouter } from 'solito/router'
import { signChallenge } from 'app/utils/userop'
import { api } from 'app/utils/api'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { bytesToHex, hexToBytes } from 'viem'

export const SignInForm = () => {
  const [isSigningIn, setIsSigningIn] = useState(false)
  const toast = useToastController()
  const router = useRouter()
  const [error, setError] = useState<Error | null>(null)

  const { mutateAsync: getChallengeMutateAsync } = api.challenge.getChallenge.useMutation({
    retry: false,
  })
  const { mutateAsync: validateSignatureMutateAsync } = api.challenge.validateSignature.useMutation(
    { retry: false }
  )

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      const challengeData = await getChallengeMutateAsync()

      const rawIdsB64: { id: string; userHandle: string }[] = []
      const { encodedWebAuthnSig, accountName, keySlot } = await signChallenge(
        challengeData.challenge as `0x${string}`,
        rawIdsB64
      )

      const encodedWebAuthnSigBytes = hexToBytes(encodedWebAuthnSig)
      const newEncodedWebAuthnSigBytes = new Uint8Array(encodedWebAuthnSigBytes.length + 1)
      newEncodedWebAuthnSigBytes[0] = keySlot
      newEncodedWebAuthnSigBytes.set(encodedWebAuthnSigBytes, 1)

      await validateSignatureMutateAsync({
        recoveryType: RecoveryOptions.WEBAUTHN,
        signature: bytesToHex(newEncodedWebAuthnSigBytes),
        challengeId: challengeData.id,
        identifier: `${accountName}.${keySlot}`,
      })

      toast.show('Successfully signed in')
      router.push('/')
    } catch (error) {
      toast.show('Failed to sign in', { preset: 'error', isUrgent: true })
      setError(error as Error)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <YStack gap="$5" jc="center" $sm={{ f: 1 }}>
      <BigHeading color="$color12">WELCOME BACK</BigHeading>
      <H3
        lineHeight={28}
        $platform-web={{ fontFamily: '$mono' }}
        $theme-light={{ col: '$gray10Light' }}
        $theme-dark={{ col: '$olive' }}
        fontWeight={'300'}
        $sm={{ size: '$5' }}
      >
        Sign in with your passkey.
      </H3>

      <YStack gap="$4">
        <SubmitButton
          onPress={handleSignIn}
          br="$3"
          bc={'$green9Light'}
          $sm={{ w: '100%' }}
          disabled={isSigningIn}
        >
          <ButtonText size={'$2'} padding={'unset'} ta="center" margin={'unset'} col="black">
            {isSigningIn ? 'SIGNING IN...' : '/SIGN IN'}
          </ButtonText>
        </SubmitButton>
        {error && <Paragraph color="$error">{error.message}</Paragraph>}
      </YStack>
    </YStack>
  )
}
