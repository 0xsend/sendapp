import type { UserOperation, GetUserOperationReceiptReturnType } from 'permissionless'
import { baseMainnetClient, entryPointAddress, baseMainnetBundlerClient } from '@my/wagmi'
import type { CallExecutionError } from 'viem'
import { signUserOp } from './signUserOp'
import { throwNiceError, useAccountNonce } from './userop'
import { assert } from 'app/utils/assert'
import { useMutation, useQueryClient } from '@tanstack/react-query'

export interface SendUserOpArgs {
  /**
   * The user operation to send.
   */
  userOp: UserOperation<'v0.7'>
  /**
   * The valid until epoch timestamp for the user op.
   */
  validUntil?: number
  /**
   * The signature version of the user op.
   */
  version?: number
  /**
   * The list of send account credentials to use for signing the user op.
   */
  webauthnCreds: { raw_credential_id: `\\x${string}`; name: string }[]
}

export function useSendUserOpMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sendUserOp,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [useAccountNonce.queryKey] })
    },
  })
}

/**
 * Sign and sends a user op. Returns the receipt of the user op.
 */
export async function sendUserOp({
  userOp,
  version,
  validUntil,
  webauthnCreds,
}: SendUserOpArgs): Promise<GetUserOperationReceiptReturnType> {
  const chainId = baseMainnetClient.chain.id
  const entryPoint = entryPointAddress[chainId]

  // simulate
  await baseMainnetClient
    .call({
      account: entryPoint,
      to: userOp.sender,
      data: userOp.callData,
    })
    .catch((e) => {
      const error = e as CallExecutionError
      console.error('Failed to simulate userop', e)
      if (error.shortMessage) throw error.shortMessage
      throw e
    })

  userOp.signature = await signUserOp({
    userOp,
    version,
    validUntil,
    webauthnCreds,
    chainId,
    entryPoint,
  })

  const hash = await baseMainnetBundlerClient
    .sendUserOperation({
      userOperation: userOp,
    })
    .catch((e) => throwNiceError(e))

  const receipt = await baseMainnetBundlerClient.waitForUserOperationReceipt({ hash })

  assert(receipt.success, 'Failed to send userOp')

  return receipt
}
