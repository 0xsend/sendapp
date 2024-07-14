import { baseMainnetClient } from '@my/wagmi'
import type { ClaimSendCheckPayload, ClaimSendCheckUserOpProps } from 'app/features/checks/types'
import {
  canCreateClaimCheckSignature,
  getCheckClaimSignature,
} from 'app/features/checks/utils/checkUtils'
import {
  canCreateClaimSendCheckUserOp,
  getClaimSendCheckUserOp,
} from 'app/features/checks/utils/getClaimSendCheckUserOp'
import { useSendAccount } from 'app/utils/send-accounts'
import { sendUserOpTransfer } from 'app/utils/useUserOpTransferMutation'
import { useAccountNonce } from 'app/utils/userop'

import debug from 'debug'
import type { GetUserOperationReceiptReturnType, UserOperation } from 'permissionless'
import { useEstimateFeesPerGas } from 'wagmi'

const logger = debug.log

export const useClaimSendCheck = (
  props: ClaimSendCheckPayload
): (() => Promise<GetUserOperationReceiptReturnType>) => {
  const { data: sendAccount } = useSendAccount()
  const { data: nonce } = useAccountNonce({ sender: sendAccount?.address })
  const { data: feesPerGas } = useEstimateFeesPerGas({
    chainId: baseMainnetClient.chain.id,
  })

  return async () => {
    const recipient = sendAccount?.address

    if (!canCreateClaimCheckSignature(props.ephemeralKeypair.ephemeralAddress, recipient)) {
      throw new Error('Cannot claim /send check. Unabel to create signature.')
    }

    const signature = await getCheckClaimSignature(
      recipient as `0x${string}`,
      props.ephemeralKeypair.ephemeralPrivateKey
    )
    const claimSendCheckUserOpProps: ClaimSendCheckUserOpProps = {
      senderAddress: sendAccount?.address as `0x${string}`,
      nonce: nonce as bigint,
      maxFeesPerGas: feesPerGas?.maxFeePerGas as bigint,
      signature,
      ...props,
    }

    if (!canCreateClaimSendCheckUserOp(claimSendCheckUserOpProps)) {
      throw new Error('Cannot claim /send check. Unable to create userOp.')
    }

    const userOp = getClaimSendCheckUserOp(claimSendCheckUserOpProps as ClaimSendCheckUserOpProps)
    const receipt = await claimSendCheck(userOp)
    return receipt
  }
}

export const claimSendCheck = async (
  claimSendCheckUserOp: UserOperation<'v0.7'>
): Promise<GetUserOperationReceiptReturnType> => {
  if (!claimSendCheckUserOp) {
    throw new Error(
      `Unable to claim /send check. /send check claim userOp required. Received: [${claimSendCheckUserOp}]`
    )
  }

  logger(`/send check claim userOp sent: [${claimSendCheckUserOp}]`)
  const receipt = await sendUserOpTransfer({ userOp: claimSendCheckUserOp })

  logger(`/send check claimed: [${receipt}]`)
  logger(`/send check claim trn hash: [${receipt.receipt.transactionHash}]`)
  return receipt
}
