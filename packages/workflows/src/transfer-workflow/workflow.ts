import { proxyActivities, ApplicationFailure, defineQuery, setHandler } from '@temporalio/workflow'
import type { createTransferActivities } from './activities'
import type { UserOperation, GetUserOperationReceiptReturnType } from 'permissionless'

const {
  simulateUserOpActivity,
  sendUserOpActivity,
  waitForTransactionReceiptActivity,
  isTransferIndexedActivity,
} = proxyActivities<ReturnType<typeof createTransferActivities>>({
  // TODO: make this configurable
  startToCloseTimeout: '45 seconds',
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

export async function TransferWorkflow(userOp: UserOperation<'v0.7'>) {
  setHandler(getTransferStateQuery, () => ({ status: 'simulating', data: { userOp } }))
  await simulateUserOpActivity(userOp)
  setHandler(getTransferStateQuery, () => ({ status: 'sending', data: { userOp } }))
  const hash = await sendUserOpActivity(userOp)
  if (!hash) throw ApplicationFailure.nonRetryable('No hash returned from sendUserOperation')
  setHandler(getTransferStateQuery, () => ({ status: 'waiting', data: { userOp, hash } }))
  const receipt = await waitForTransactionReceiptActivity(hash)
  if (!receipt)
    throw ApplicationFailure.nonRetryable('No receipt returned from waitForTransactionReceipt')
  setHandler(getTransferStateQuery, () => ({ status: 'indexing', data: { userOp, receipt } }))
  const transfer = await isTransferIndexedActivity(receipt.receipt.transactionHash)
  if (!transfer) throw ApplicationFailure.retryable('Transfer not yet indexed in db')
  setHandler(getTransferStateQuery, () => ({ status: 'confirmed', data: { userOp, receipt } }))
  return transfer
}
