import type {
  UserOperation,
  GetUserOperationReceiptReturnType,
  WaitForUserOperationReceiptParameters,
} from 'permissionless'
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

export async function waitForUserOperationReceipt(
  params: WaitForUserOperationReceiptParameters
): Promise<GetUserOperationReceiptReturnType> {
  return await baseMainnetBundlerClient.waitForUserOperationReceipt(params)
}
