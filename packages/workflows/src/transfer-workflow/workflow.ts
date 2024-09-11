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

type BaseState = { userOp: UserOperation<'v0.7'> }

type Simulating = { status: 'simulating' } & BaseState
type Sending = { status: 'sending' } & BaseState
type Waiting = { status: 'waiting'; hash: string } & BaseState
type Indexing = {
  status: 'indexing'
  receipt: GetUserOperationReceiptReturnType
} & BaseState
type Confirmed = {
  status: 'confirmed'
  receipt: GetUserOperationReceiptReturnType
} & BaseState

export type transferState = Simulating | Sending | Waiting | Indexing | Confirmed

export const getTransferStateQuery = defineQuery<transferState>('getTransferState')

export async function TransferWorkflow(userOp: UserOperation<'v0.7'>) {
  setHandler(getTransferStateQuery, () => ({ status: 'simulating', userOp }))
  await simulateUserOpActivity(userOp)
  setHandler(getTransferStateQuery, () => ({ status: 'sending', userOp }))
  const hash = await sendUserOpActivity(userOp)
  if (!hash) throw ApplicationFailure.nonRetryable('No hash returned from sendUserOperation')
  setHandler(getTransferStateQuery, () => ({ status: 'waiting', userOp, hash }))
  const receipt = await waitForTransactionReceiptActivity(hash)
  if (!receipt)
    throw ApplicationFailure.nonRetryable('No receipt returned from waitForTransactionReceipt')
  setHandler(getTransferStateQuery, () => ({ status: 'indexing', userOp, receipt }))
  const transfer = await isTransferIndexedActivity(receipt.receipt.transactionHash)
  if (!transfer) throw ApplicationFailure.retryable('Transfer not yet indexed in db')
  setHandler(getTransferStateQuery, () => ({ status: 'confirmed', userOp, receipt }))
  return transfer
}
