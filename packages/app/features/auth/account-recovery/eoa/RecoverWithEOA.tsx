import { useAccount, useSignMessage } from 'wagmi'
import type { SignMessageErrorType } from '@wagmi/core'
import type { SignMessageData, SignMessageVariables } from 'wagmi/query'
import { Button, ButtonText } from '@my/ui'
import { Provider } from 'app/provider'
import { OpenConnectModalWrapper } from 'app/utils/OpenConnectModalWrapper'
import { type ChallengeResponse, RecoveryOptions } from '@my/api/src/routers/account-recovery/types'

interface Props {
  challengeData: ChallengeResponse
  // https://wagmi.sh/react/api/hooks/useSignMessage#onsuccess
  onSignSuccess: (data: SignMessageData, variables: SignMessageVariables, context: unknown) => void
  // https://wagmi.sh/react/api/hooks/useSignMessage#onerror
  onSignError: (
    error: SignMessageErrorType,
    variables: SignMessageVariables,
    context: unknown
  ) => void
}

export default function RecoverWithEOA(props: Props) {
  const { signMessage } = useSignMessage()
  const { address } = useAccount()

  const onPress = async () => {
    if (props.challengeData.challenge) {
      signMessage(
        {
          message: props.challengeData.challenge,
          account: address,
        },
        {
          onSuccess: props.onSignSuccess,
          onError: props.onSignError,
        }
      )
    }
  }

  return (
    <Provider>
      <OpenConnectModalWrapper>
        {address && (
          // TODO: front-end devs: remove hardcoded width
          <Button onPress={onPress} width={'$12'}>
            <ButtonText>EOA</ButtonText>
          </Button>
        )}
      </OpenConnectModalWrapper>
    </Provider>
  )
}
