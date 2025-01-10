import { type QueryClient, useMutation, type UseMutationOptions } from '@tanstack/react-query'
import { getUserOperationHash, type UserOperation } from 'permissionless'
import { baseMainnetClient, entryPointAddress, baseMainnetBundlerClient } from '@my/wagmi'
import type { CallExecutionError } from 'viem'
import { byteaToBase64 } from './byteaToBase64'
import { signUserOp } from './signUserOp'
import { throwNiceError } from './userop'

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

/**
 * Sign and sends a user op. Returns the hash of the user op.
 */
export async function sendUserOp({ userOp, version, validUntil, webauthnCreds }: SendUserOpArgs) {
  const chainId = baseMainnetClient.chain.id
  const entryPoint = entryPointAddress[chainId]
  const userOpHash = getUserOperationHash({
    userOperation: userOp,
    entryPoint,
    chainId,
  })

  // simulate
  await baseMainnetClient
    .call({
      account: entryPointAddress[baseMainnetClient.chain.id],
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
    userOpHash,
    version,
    validUntil,
    allowedCredentials:
      webauthnCreds?.map((c) => ({
        id: byteaToBase64(c.raw_credential_id),
        userHandle: c.name,
      })) ?? [],
  })

  return await baseMainnetBundlerClient
    .sendUserOperation({
      userOperation: userOp,
    })
    .catch((e) => throwNiceError(e))
}
