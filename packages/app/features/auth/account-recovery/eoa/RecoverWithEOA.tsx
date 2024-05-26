import { useAccount, useSignMessage } from 'wagmi'
import type { SignMessageErrorType } from '@wagmi/core'
import type { SignMessageData, SignMessageVariables } from 'wagmi/query'
import { Button, ButtonText } from '@my/ui'
import { Provider } from 'app/provider'
import { OpenConnectModalWrapper } from 'app/utils/OpenConnectModalWrapper'
import { SignState } from 'app/features/auth/account-recovery/account-recovery'
import { type ChallengeResponse, RecoveryOptions } from '@my/api/src/routers/account-recovery/types'

interface Props {
  getChallenge: (
    recoveryType: RecoveryOptions,
    identifier?: `0x${string}` | string
  ) => Promise<ChallengeResponse>
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
    const challengeData = await props.getChallenge(RecoveryOptions.EOA, address)
    if (challengeData?.challenge) {
      signMessage(
        {
          message: challengeData.challenge,
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
