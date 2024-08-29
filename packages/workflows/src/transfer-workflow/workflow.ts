import { proxyActivities, ApplicationFailure, defineQuery, setHandler } from '@temporalio/workflow'
import type { createTransferActivities } from './activities'
import type { Hex } from 'viem'

const { sendUserOpActivity, waitForTransactionReceiptActivity, fetchTransferActivity } =
  proxyActivities<ReturnType<typeof createTransferActivities>>({
    startToCloseTimeout: '30 seconds',
  })

type simulating = { status: 'simulating'; data: { userOp: UserOperation<'v0.7'> } }
type sending = { status: 'sending'; data: { userOp: UserOperation<'v0.7'> } }
type waiting = { status: 'waiting'; data: { hash: string; userOp: UserOperation<'v0.7'> } }
type indexing = {
  status: 'indexing'
  data: { receipt: GetUserOperationReceiptReturnType; userOp: UserOperation<'v0.7'> }
}
type confirmed = {
  status: 'confirmed'
  data: { receipt: GetUserOperationReceiptReturnType; userOp: UserOperation<'v0.7'> }
}

export type transferState = simulating | sending | waiting | indexing | confirmed

export const getTransferStateQuery = defineQuery<transferState>('getTransferState')

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
  setHandler(getTransferStateQuery, () => ({ status: 'waiting', data: { userOp, hash } }))
  const receipt = await waitForTransactionReceiptActivity(hash)
  if (!receipt)
    throw ApplicationFailure.nonRetryable('No receipt returned from waitForTransactionReceipt')
  setHandler(getTransferStateQuery, () => ({ status: 'indexing', data: { userOp, receipt } }))
  const transfer = await fetchTransferActivity(receipt.userOpHash)
  if (!transfer) throw ApplicationFailure.retryable('Transfer not yet indexed in db')
  setHandler(getTransferStateQuery, () => ({ status: 'confirmed', data: { userOp, receipt } }))
  return transfer
}
