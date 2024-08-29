import { proxyActivities, ApplicationFailure } from '@temporalio/workflow'
import type { createTransferActivities } from './activities'
import type { Hex } from 'viem'

const { sendUserOpActivity, waitForTransactionReceiptActivity, fetchTransferActivity } =
  proxyActivities<ReturnType<typeof createTransferActivities>>({
    startToCloseTimeout: '30 seconds',
  })

export type TransferWorkflowArgs = {
  sender: Hex
  to: Hex
  token?: Hex
  amount: string
  nonce: string
  signature: Hex
}

export async function TransferWorkflow(args: TransferWorkflowArgs) {
  const hash = await sendUserOpActivity(args)
  if (!hash) throw ApplicationFailure.nonRetryable('No hash returned from sendUserOperation')
  const receipt = await waitForTransactionReceiptActivity(hash)
  if (!receipt)
    throw ApplicationFailure.nonRetryable('No receipt returned from waitForTransactionReceipt')
  const transfer = await fetchTransferActivity(receipt.userOpHash)
  if (!transfer) throw ApplicationFailure.retryable('Transfer not yet indexed in db')
  return transfer
}
