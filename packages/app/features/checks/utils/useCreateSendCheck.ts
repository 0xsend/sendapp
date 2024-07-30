import { useSendAccount } from 'app/utils/send-accounts'
import { useAccountNonce } from 'app/utils/userop'
import { sendUserOpTransfer } from 'app/utils/useUserOpTransferMutation'
import {
  type CreateSendCheckProps,
  CreateSendCheckReturnType,
  type useCreateSendCheckReturnType,
  type CreateSendCheckUserOpProps,
} from 'app/features/checks/types'
import debug from 'debug'
import type { GetUserOperationReceiptReturnType, UserOperation } from 'permissionless'
import { getCreateSendCheckUserOp } from 'app/features/checks/utils/getCreateSendCheckUserOp'
import { useEstimateFeesPerGas } from 'wagmi'
import { baseMainnetClient } from '@my/wagmi'
import { useUser } from 'app/utils/useUser'
import { type Hex, isAddress } from 'viem'
import { assert } from 'app/utils/assert'

const logger = debug.log

/**
 * Hook returning a callback for creating and sending a check. This hook encapsulates the logic required to initiate the process of creating a check based on the specified properties, and then sending it to the intended recipient.
 * @param {CreateSendCheckProps} props - The properties required for creating and sending a check, including the token address, ephemeral keypair, and the amount to be sent.
 * @returns {CreateSendCheckReturnType} - An object containing the success of the /send checks creation userOp. See {@link CreateSendCheckReturnType} for more details.
 */
export const useCreateSendCheck = (props: CreateSendCheckProps): useCreateSendCheckReturnType => {
  const { data: sendAccount } = useSendAccount()
  const { profile } = useUser()
  const { data: nonce } = useAccountNonce({ sender: sendAccount?.address })
  const { data: feesPerGas } = useEstimateFeesPerGas({
    chainId: baseMainnetClient.chain.id,
  })

  // get /send check creation user op
  return async () => {
    validateCreateSendCheckArgs(
      profile?.send_id,
      nonce,
      sendAccount?.address,
      feesPerGas?.maxFeePerGas
    )

    const userOpProps: CreateSendCheckUserOpProps = {
      senderAddress: sendAccount?.address as `0x${string}`,
      nonce: nonce as bigint,
      maxFeesPerGas: feesPerGas?.maxFeePerGas as bigint,
      ...props,
    }

    const userOp = getCreateSendCheckUserOp(userOpProps)
    const receipt = await createSendCheck(userOp)
    const senderSendId = profile.send_id
    return {
      receipt,
      senderSendId,
      ephemeralKeypair: props.ephemeralKeypair,
    }
  }
}

/**
 * Creates a /send check from a /send check userOp
 * @param {UserOperation<'v0.7'>} createSendCheckUserOp - userOp for /send check creation
 * @returns {Promise<GetUserOperationReceiptReturnType>} - userOp receipt
 */
export const createSendCheck = async (
  createSendCheckUserOp: UserOperation<'v0.7'>
): Promise<GetUserOperationReceiptReturnType> => {
  if (!createSendCheckUserOp) {
    throw new Error(
      `Unable to create /send check. /send check creation userOp required. Received: [${createSendCheckUserOp}]`
    )
  }

  // send /send check creation user op
  logger(`/send check creation userOp sent: [${createSendCheckUserOp}]`)
  const receipt = await sendUserOpTransfer({ userOp: createSendCheckUserOp })

  logger(`/send check created: [${receipt}]`)
  logger(`/send check creation trn hash: [${receipt.receipt.transactionHash}]`)
  return receipt
}

const validateCreateSendCheckArgs = (
  sendId?: number,
  nonce?: bigint,
  senderAddress?: Hex,
  feesPerGas?: bigint
) => {
  assert(!!sendId, 'Invalid send ID.')
  assert(typeof nonce === 'bigint' && nonce >= 0n, `Invalid nonce. Received: ${nonce}`)
  assert(!!senderAddress && isAddress(senderAddress), 'Invalid sender address.')
  assert(!!feesPerGas && feesPerGas > 0n, `Invalid fees per gas. Received: ${feesPerGas}`)
}
