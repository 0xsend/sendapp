import { useAccount, useSignMessage } from 'wagmi'
import type { SignMessageData, SignMessageVariables } from 'wagmi/query'
import { Button, ButtonText } from '@my/ui'
import { Provider } from 'app/provider'
import { OpenConnectModalWrapper } from 'app/utils/OpenConnectModalWrapper'
import {
  type ChallengeResponse,
  type VerifyChallengeRequest,
  RecoveryOptions,
} from '@my/api/src/routers/account-recovery/types'
import type { SignState } from 'app/features/auth/account-recovery/account-recovery'

interface Props {
  challengeData: ChallengeResponse
  signState: SignState

  onSignSuccess: (args: VerifyChallengeRequest) => Promise<void>
  onSignError: () => void
}

export default function RecoverWithEOA(props: Props) {
  const { signMessage } = useSignMessage()
  const { address } = useAccount()

  // https://wagmi.sh/react/api/hooks/useSignMessage#onsuccess
  const onSuccess = async (
    data: SignMessageData,
    variables: SignMessageVariables,
    context: unknown
  ) => {
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
          message: props.challengeData.challenge,
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
    <Provider>
      <OpenConnectModalWrapper>
        <Button onPress={onPress} width={'$12'}>
          <ButtonText>EOA</ButtonText>
        </Button>
      </OpenConnectModalWrapper>
    </Provider>
  )
}
