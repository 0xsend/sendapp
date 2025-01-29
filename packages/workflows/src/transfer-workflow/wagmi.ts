import type { UserOperation } from 'permissionless'
import { baseMainnetBundlerClient, baseMainnetClient, entryPointAddress } from '@my/wagmi'
import type { Hex } from 'viem'

export async function getUserOperationByHash(hash: `0x${string}`) {
  return await baseMainnetBundlerClient.getUserOperationByHash({ hash })
}

export async function simulateUserOperation(userOp: UserOperation<'v0.7'>) {
  return await baseMainnetClient.call({
    account: entryPointAddress[baseMainnetClient.chain.id],
    to: userOp.sender,
    data: userOp.callData,
  })
}

export async function sendUserOperation(userOp: UserOperation<'v0.7'>) {
  return await baseMainnetBundlerClient.sendUserOperation({
    userOperation: userOp,
  })
}

export async function waitForTransactionReceipt(hash: `0x${string}`) {
  return await baseMainnetBundlerClient.waitForUserOperationReceipt({ hash })
}
