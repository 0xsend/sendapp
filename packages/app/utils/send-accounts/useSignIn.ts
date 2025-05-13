import { useMutation } from '@tanstack/react-query'
import { api } from 'app/utils/api'
import { signChallenge } from 'app/utils/signChallenge'
import { bytesToHex, hexToBytes } from 'viem'
import { RecoveryOptions } from '@my/api/src/routers/account-recovery/types'

export const useSignIn = () => {
  const { mutateAsync: getChallenge } = api.challenge.getChallenge.useMutation({ retry: false })
  const { mutateAsync: validateSignature } = api.challenge.validateSignature.useMutation({
    retry: false,
  })

  return useMutation({
    mutationFn: async ({
      allowedCredentials = [],
    }: {
      allowedCredentials?: { id: string; userHandle: string }[]
    }) => {
      const challengeData = await getChallenge()

      console.log('challengeData', challengeData)

      const { encodedWebAuthnSig, accountName, keySlot } = await signChallenge(
        challengeData.challenge as `0x${string}`,
        allowedCredentials
      )

      console.log('encodedWebAuthnSig', encodedWebAuthnSig)
      console.log('accountName', accountName)
      console.log('keySlot', keySlot)

      const encodedWebAuthnSigBytes = hexToBytes(encodedWebAuthnSig)
      const newEncodedWebAuthnSigBytes = new Uint8Array(encodedWebAuthnSigBytes.length + 1)
      newEncodedWebAuthnSigBytes[0] = keySlot
      newEncodedWebAuthnSigBytes.set(encodedWebAuthnSigBytes, 1)

      await validateSignature({
        recoveryType: RecoveryOptions.WEBAUTHN,
        signature: bytesToHex(newEncodedWebAuthnSigBytes),
        challengeId: challengeData.id,
        identifier: `${accountName}.${keySlot}`,
      })
    },
    retry: false,
  })
}
