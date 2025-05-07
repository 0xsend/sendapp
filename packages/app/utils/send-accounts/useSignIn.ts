import { api } from 'app/utils/api'
import { signChallenge } from 'app/utils/signChallenge'
import { bytesToHex, hexToBytes } from 'viem'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'

export const useSignIn = () => {
  const { mutateAsync: getChallengeMutateAsync } = api.challenge.getChallenge.useMutation({
    retry: false,
  })

  const { mutateAsync: validateSignatureMutateAsync } = api.challenge.validateSignature.useMutation(
    { retry: false }
  )

  const signIn = async ({
    allowedCredentials = [],
  }: {
    allowedCredentials?: { id: string; userHandle: string }[]
  }) => {
    const challengeData = await getChallengeMutateAsync()

    const { encodedWebAuthnSig, accountName, keySlot } = await signChallenge(
      challengeData.challenge as `0x${string}`,
      allowedCredentials
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
  }

  return { signIn }
}
