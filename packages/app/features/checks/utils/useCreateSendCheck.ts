import { useCallback } from 'react'
import { useSendAccount } from 'app/utils/send-accounts'
import { useAccountNonce } from 'app/utils/userop'
import { useCreateSendCheckUserOp } from 'app/features/checks/utils/useCreateSendCheckUserOp'
import { sendUserOpTransfer } from 'app/utils/useUserOpTransferMutation'
import {
  type CreateSendCheckProps,
  CreateSendCheckReturnType,
  type useCreateSendCheckReturnType,
} from 'app/features/checks/types'
import debug from 'debug'
import type { GetUserOperationReceiptReturnType, UserOperation } from 'permissionless'

const logger = debug.log

/**
 * Hook returning a callback for creating and sending a check. This hook encapsulates the logic required to initiate the process of creating a check based on the specified properties, and then sending it to the intended recipient.
 * @param {CreateSendCheckProps} props - The properties required for creating and sending a check, including the token address, ephemeral keypair, and the amount to be sent.
 * @returns {CreateSendCheckReturnType} - An object containing the success of the /send checks creation userOp. See {@link CreateSendCheckReturnType} for more details.
 */
export const useCreateSendCheck = (props: CreateSendCheckProps): useCreateSendCheckReturnType => {
  const { data: sendAccount, error: sendAccountError } = useSendAccount()
  const { data: nonce, error: nonceError } = useAccountNonce({ sender: sendAccount?.address })

  // get /send check creation user op
  const createSendCheckUserOpQuery = useCreateSendCheckUserOp({
    senderAddress: sendAccount?.address,
    nonce: nonce,
    ...props,
  })

  return useCallback(async () => {
    if (!sendAccount || sendAccountError) {
      throw new Error(
        `Unable to create /send check. Invalid /send account. Received: [${sendAccount}]. Error: [${sendAccountError}]`
      )
    }

    if (nonce === undefined || nonceError) {
      throw new Error(
        `Unable to create /send check. Invalid nonce. Received: [${nonce}]. Error: [${nonceError}]`
      )
    }

    const senderAccountId = sendAccount.id

    const receipt = await createSendCheck(createSendCheckUserOpQuery.data)
    return {
      receipt,
      senderAccountId,
      ephemeralKeypair: props.ephemeralKeypair,
    }
  }, [
    sendAccount,
    sendAccountError,
    nonce,
    nonceError,
    createSendCheckUserOpQuery.data,
    props.ephemeralKeypair,
  ])
}

/**
 * Creates a /send check from a /send check userOp
 * @param {UserOperation<'v0.7'>} createSendCheckUserOp - userOp for /send check creation
 * @returns {Promise<GetUserOperationReceiptReturnType>} - userOp receipt
 */
export const createSendCheck = async (
  createSendCheckUserOp?: UserOperation<'v0.7'>
): Promise<GetUserOperationReceiptReturnType> => {
  if (!createSendCheckUserOp) {
    throw new Error(
      `Unable to create /send check. /send check creation userOp required. Received: [${createSendCheckUserOp}]`
    )
  }

  logger(`created /send check creation userOp: [${createSendCheckUserOp}]`)

  // send /send check creation user op
  const receipt = await sendUserOpTransfer({ userOp: createSendCheckUserOp })

  logger(`/send check creation userOp sent: [${receipt}]`)
  logger(`/send check created: [${receipt.receipt.transactionHash}]`)
  return receipt
}
