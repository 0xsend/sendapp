import {
  RecoveryEOAPreamble,
  RecoveryOptions,
  type ChallengeResponse,
  type VerifyChallengeRequest,
} from '@my/api/src/routers/account-recovery/types'
import { Button, ButtonText } from '@my/ui'
import type { SignMessageErrorType } from '@wagmi/core'
import type { SignState } from 'app/features/auth/account-recovery/account-recovery'
import { OpenConnectModalWrapper } from 'app/utils/OpenConnectModalWrapper'
import { useAccount, useSignMessage } from 'wagmi'
import type { SignMessageData, SignMessageVariables } from 'wagmi/query'

interface Props {
  challengeData: ChallengeResponse
  signState: SignState

  onSignSuccess: (args: VerifyChallengeRequest) => Promise<void>
  onSignError: (e: SignMessageErrorType) => void
}

export default function RecoverWithEOA(props: Props) {
  const { signMessage } = useSignMessage()
  const { address, isConnected } = useAccount()

  const onSuccess = async (data: SignMessageData, variables: SignMessageVariables) => {
    await props.onSignSuccess({
      recoveryType: RecoveryOptions.EOA,
      signature: data,
      identifier: variables.account as string,
      challengeId: props.challengeData.id,
    })
  }

  const onPress = async () => {
    if (props.challengeData.challenge) {
      signMessage(
        {
          message: RecoveryEOAPreamble + props.challengeData.challenge,
          account: address,
        },
        {
          onSuccess: onSuccess,
          onError: props.onSignError,
        }
      )
    }
  }

  return (
    <OpenConnectModalWrapper width={'50%'}>
      <Button onPress={isConnected ? onPress : null} theme="green" br="$4">
        <ButtonText testID="account-recovery-eoa-btn">EOA</ButtonText>
      </Button>
    </OpenConnectModalWrapper>
  )
}
