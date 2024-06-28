import { Button, ButtonText } from '@my/ui'
import { signChallenge } from 'app/utils/userop'
import {
  RecoveryOptions,
  type ChallengeResponse,
  type VerifyChallengeRequest,
} from '@my/api/src/routers/account-recovery/types'
import { bytesToHex, hexToBytes } from 'viem'
import type { SignMessageErrorType } from '@wagmi/core'

interface Props {
  challengeData: ChallengeResponse
  onSignSuccess: (args: VerifyChallengeRequest) => void
  // https://wagmi.sh/react/api/hooks/useSignMessage#onerror
  onSignError: (e: SignMessageErrorType) => void
}

export default function RecoverWithPasskey(props: Props) {
  const onPress = async () => {
    const rawIdsB64: { id: string; userHandle: string }[] = [] // this user is anon so only resident keys are allowed
    const { encodedWebAuthnSig, accountName, keySlot } = await signChallenge(
      props.challengeData.challenge as `0x${string}`,
      rawIdsB64
    )

    // SendVerifier.verifySignature expects the first byte to be the passkey keySlot, followed by the signature
    const encodedWebAuthnSigBytes = hexToBytes(encodedWebAuthnSig)
    const newEncodedWebAuthnSigBytes = new Uint8Array(encodedWebAuthnSigBytes.length + 1)
    newEncodedWebAuthnSigBytes[0] = keySlot
    newEncodedWebAuthnSigBytes.set(encodedWebAuthnSigBytes, 1)

    props.onSignSuccess({
      recoveryType: RecoveryOptions.WEBAUTHN,
      signature: bytesToHex(newEncodedWebAuthnSigBytes),
      challengeId: props.challengeData.id,
      identifier: `${accountName}.${keySlot}`,
    })
  }

  return (
    <Button
      onPress={onPress}
      width="50%"
      theme={'green_ghost'}
      boc="$borderColor"
      bw={1}
      br="$4"
      testID="account-recovery-passkey-btn"
    >
      <ButtonText>PASSKEY</ButtonText>
    </Button>
  )
}
