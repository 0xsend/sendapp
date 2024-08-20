// sign-in-form.tsx
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'
import { ButtonText, SubmitButton, useToastController } from '@my/ui'
import { api } from 'app/utils/api'
import { signChallenge } from 'app/utils/signChallenge'
import { useState } from 'react'
import { useRouter } from 'solito/router'
import { bytesToHex, hexToBytes } from 'viem'
import { useAuthScreenParams } from 'app/routers/params'

export const SignInButton = ({ setError, ...props }) => {
  const [queryParams] = useAuthScreenParams()
  const { redirectUri } = queryParams
  const [isSigningIn, setIsSigningIn] = useState(false)
  const toast = useToastController()
  const router = useRouter()

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

      router.push(redirectUri ?? '/')
    } catch (error) {
      toast.show('Failed to sign in', { preset: 'error', isUrgent: true })
      setError(error as Error)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <SubmitButton onPress={handleSignIn} disabled={isSigningIn} br={'$4'} {...props}>
      <ButtonText padding={'unset'} margin={'unset'}>
        {isSigningIn ? 'SIGNING IN...' : 'SIGN-IN'}
      </ButtonText>
    </SubmitButton>
  )
}
