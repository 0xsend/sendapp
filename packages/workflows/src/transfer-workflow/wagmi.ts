import type { UserOperation, GetUserOperationReceiptReturnType } from 'permissionless'
import { baseMainnetBundlerClient, baseMainnetClient, entryPointAddress } from '@my/wagmi'

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

export async function waitForTransactionReceipt(
  hash: `0x${string}`
): Promise<GetUserOperationReceiptReturnType> {
  return await baseMainnetBundlerClient.waitForUserOperationReceipt({ hash })
}

export async function getBaseBlockNumber() {
  return await baseMainnetClient.getBlockNumber()
}
