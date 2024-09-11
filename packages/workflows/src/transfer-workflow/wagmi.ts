import type { UserOperation } from 'permissionless'
import { baseMainnetBundlerClient, baseMainnetClient, entryPointAddress } from '@my/wagmi'
import type { Hex } from 'viem'
import superjson from 'superjson'

import { log } from '@temporalio/activity'

/**
 * default user op with preset gas values that work will probably need to move this to the database.
 * Paymaster post-op gas limit could be set dynamically based on the status of the paymaster if the price cache is
 * outdated, otherwise, a lower post op gas limit around only 50K is needed. In case of needing to update cached price,
 * the post op uses around 75K gas.
 *
 * - [example no update price](https://www.tdly.co/shared/simulation/a0122fae-a88c-47cd-901c-02de87901b45)
 * - [Failed due to OOG](https://www.tdly.co/shared/simulation/c259922c-8248-4b43-b340-6ebbfc69bcea)
 */
export const defaultUserOp: Pick<
  UserOperation<'v0.7'>,
  | 'callGasLimit'
  | 'verificationGasLimit'
  | 'preVerificationGas'
  | 'maxFeePerGas'
  | 'maxPriorityFeePerGas'
  | 'paymasterVerificationGasLimit'
  | 'paymasterPostOpGasLimit'
> = {
  callGasLimit: 100000n,
  verificationGasLimit: 550000n,
  preVerificationGas: 70000n,
  maxFeePerGas: 10000000n,
  maxPriorityFeePerGas: 10000000n,
  paymasterVerificationGasLimit: 150000n,
  paymasterPostOpGasLimit: 100000n,
}

export async function simulateUserOperation(userOp: UserOperation<'v0.7'>) {
  return await baseMainnetClient.call({
    account: entryPointAddress[baseMainnetClient.chain.id],
    to: userOp.sender,
    data: userOp.callData,
  })
}

export async function sendUserOperation(userOp: UserOperation<'v0.7'>) {
  log.info('Sending UserOperation', { userOp: superjson.stringify(userOp) })
  try {
    const hash = await baseMainnetBundlerClient.sendUserOperation({
      userOperation: userOp,
    })
    log.info('UserOperation sent successfully', { hash })
    return hash
  } catch (error) {
    log.error('Error in sendUserOperation', {
      error: error instanceof Error ? error.message : String(error),
      userOp: superjson.stringify(userOp),
    })
    throw error
  }
}

export async function waitForTransactionReceipt(hash: `0x${string}`) {
  const receipt = await baseMainnetBundlerClient.waitForUserOperationReceipt({ hash })
  return receipt
}
