import { Button, ButtonText } from '@my/ui'
import { signChallenge } from 'app/utils/userop'
import {
  RecoveryOptions,
  type ChallengeResponse,
  type VerifyChallengeRequest,
} from '@my/api/src/routers/account-recovery/types'
import { bytesToHex, hexToBytes } from 'viem'

interface Props {
  challengeData: ChallengeResponse
  onSignSuccess: (args: VerifyChallengeRequest) => void
  // https://wagmi.sh/react/api/hooks/useSignMessage#onerror
  onSignError: () => void
}

export default function RecoverWithPasskey(props: Props) {
  const onPress = async () => {
    const { encodedWebAuthnSig, accountName, keySlot } = await signChallenge(
      props.challengeData.challenge as `0x${string}`
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
    <Button onPress={onPress} width="50%" testID="account-recovery-passkey-btn">
      <ButtonText>PASSKEY</ButtonText>
    </Button>
  )
}
