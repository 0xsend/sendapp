import { useAccount, useSignMessage } from 'wagmi'
import type { SignMessageErrorType } from '@wagmi/core'
import type { SignMessageData, SignMessageVariables } from 'wagmi/query'
import { Button, ButtonText, Spinner } from '@my/ui'
import { Provider } from 'app/provider'
import { OpenConnectModalWrapper } from 'app/utils/OpenConnectModalWrapper'
import { useCallback } from 'react'
import { SignState } from 'app/features/auth/account-recovery/screen'
import type { ChallengeResponse } from '@my/api/src/routers/account-recovery/types'

interface Props {
  challenge: ChallengeResponse
  signState: SignState
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

  const getButtonContent = useCallback(() => {
    switch (props.signState) {
      case SignState.NOT_COMPLETE:
        return 'EOA'
      case SignState.IN_PROGRESS:
        return <Spinner size="small" color="$color11" />
      case SignState.FAILED:
        return 'TODO: failed icon + inline error'
    }
  }, [props.signState])

  const onPress = () => {
    signMessage(
      {
        message: props.challenge?.challenge,
        account: address,
      },
      {
        onSuccess: props.onSignSuccess,
        onError: props.onSignError,
      }
    )
  }

  return (
    <Provider>
      <OpenConnectModalWrapper flexBasis={0} flexGrow={1}>
        {address && (
          <Button onPress={onPress}>
            <ButtonText>{getButtonContent()}</ButtonText>
          </Button>
        )}
      </OpenConnectModalWrapper>
    </Provider>
  )
}
