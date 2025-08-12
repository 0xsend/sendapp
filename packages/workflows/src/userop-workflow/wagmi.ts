import type {
  UserOperation,
  GetUserOperationReceiptReturnType,
  WaitForUserOperationReceiptParameters,
  GetUserOperationReceiptParameters,
} from 'permissionless'
import { baseMainnetBundlerClient, baseMainnetClient, entryPointAddress } from '@my/wagmi'
import type { Hex } from 'viem'

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

export async function waitForUserOperationReceipt(
  params: WaitForUserOperationReceiptParameters
): Promise<GetUserOperationReceiptReturnType> {
  return await baseMainnetBundlerClient.waitForUserOperationReceipt(params)
}

export async function getUserOperationReceipt(
  params: GetUserOperationReceiptParameters
): Promise<GetUserOperationReceiptReturnType | null> {
  return await baseMainnetBundlerClient.getUserOperationReceipt(params)
}

export async function getBaseBlockNumber() {
  return await baseMainnetClient.getBlockNumber()
}

export async function getBaseBlock(blockHash: Hex) {
  return await baseMainnetClient.getBlock({ blockHash })
}
