import {
  ClaimButton,
  type ClaimSendCheckBtnProps,
} from 'app/features/checks/components/claim/btn/ClaimButton'
import type { ClaimSendCheckPayload } from 'app/features/checks/types'
import { useClaimSendCheck } from 'app/features/checks/utils/useClaimSendCheck'

interface Props extends ClaimSendCheckBtnProps {
  payload: ClaimSendCheckPayload
  onSuccess: () => void
  onError: (error: Error) => void
}

export const ClaimButtonUser = (props: Props) => {
  const claimSendCheck = useClaimSendCheck(props.payload)
  const claimCheck = () => {
    claimSendCheck()
      .then((receipt) => {
        if (!receipt.success) {
          props.onError(new Error('Error claiming send check'))
          return
        }
        props.onSuccess()
      })
      .catch((error) => {
        props.onError(error)
      })
  }

  const onPress = () => {
    claimCheck()
  }

  return <ClaimButton tokenId={props.tokenId} tokenAmount={props.tokenAmount} onPress={onPress} />
}
