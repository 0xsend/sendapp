import type { UserOperation, GetUserOperationReceiptReturnType } from 'permissionless'
import { baseMainnetBundlerClient, baseMainnetClient, entryPointAddress } from '@my/wagmi'
import type { Hex, Address } from 'viem'

export const TRANSFER_SIGNATURE_HASH = '0xddf252ad'
export const RECEIVE_SIGNATURE_HASH = '0x88a5966d'

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

export function isTransferTopic(topic: Hex) {
  return topic.startsWith(TRANSFER_SIGNATURE_HASH)
}

export function isReceiveTopic(topic: Hex) {
  return topic.startsWith(RECEIVE_SIGNATURE_HASH)
}

export function isAddressInTopic(topic: Hex, address: Address) {
  return topic.includes(address.replace('0x', '').toLowerCase())
}
