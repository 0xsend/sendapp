import type {
  UserOperation,
  GetUserOperationReceiptReturnType,
  WaitForUserOperationReceiptParameters,
} from 'permissionless'
import { baseMainnetClient, cdpBundlerClient, entryPointAddress } from '@my/wagmi'

export async function simulateUserOperation(userOp: UserOperation<'v0.7'>) {
  return await baseMainnetClient.call({
    account: entryPointAddress[baseMainnetClient.chain.id],
    to: userOp.sender,
    data: userOp.callData,
  })
}

export async function sendUserOperation(userOp: UserOperation<'v0.7'>) {
  return await cdpBundlerClient.sendUserOperation({
    userOperation: userOp,
  })
}

export async function waitForTransactionReceipt(
  hash: `0x${string}`
): Promise<GetUserOperationReceiptReturnType> {
  return await cdpBundlerClient.waitForUserOperationReceipt({ hash })
}

export async function waitForUserOperationReceipt(
  params: WaitForUserOperationReceiptParameters
): Promise<GetUserOperationReceiptReturnType> {
  return await cdpBundlerClient.waitForUserOperationReceipt(params)
}

export async function getBaseBlockNumber() {
  return await baseMainnetClient.getBlockNumber()
}
