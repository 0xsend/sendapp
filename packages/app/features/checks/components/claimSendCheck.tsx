import { Button } from '@my/ui'
import { useClaimSendCheck } from 'app/features/checks/utils/useClaimSendCheck'
import type { ClaimSendCheckPayload } from 'app/features/checks/types'
import type { GetUserOperationReceiptReturnType } from 'permissionless'

interface Props {
  payload: ClaimSendCheckPayload
  onSuccess: (receipt: GetUserOperationReceiptReturnType) => void
  onError: (error: Error) => void
}

export const ClaimSendCheck = (props: Props) => {
  const claimSendCheck = useClaimSendCheck(props.payload)

  const onPress = async () => {
    try {
      const receipt = await claimSendCheck()
      if (!receipt.success) {
        props.onError(new Error('Error claiming send check'))
        return
      }
      props.onSuccess(receipt)
    } catch (e) {
      props.onError(e)
    }
  }

  return <Button onPress={onPress}>Claim Check</Button>
}
