import { proxyActivities, ApplicationFailure, defineQuery, setHandler } from '@temporalio/workflow'
import type { createTransferActivities } from './activities'
import type { UserOperation, GetUserOperationReceiptReturnType } from 'permissionless'
import debug from 'debug'
import superjson from 'superjson'

const log = debug('workflows:transfer')

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
  receipt: GetUserOperationReceiptReturnType | boolean
} & BaseState

export type transferState = simulating | sending | waiting | indexing | confirmed

export const getTransferStateQuery = defineQuery<transferState>('getTransferState')

export async function TransferWorkflow(userOp: UserOperation<'v0.7'>) {
  setHandler(getTransferStateQuery, () => ({ status: 'simulating', data: { userOp } }))
  log('SendTransferWorkflow started with userOp:', JSON.stringify(parsedUserOp, null, 2))
  await simulateUserOpActivity(userOp)
  log('Simulation completed')
  setHandler(getTransferStateQuery, () => ({ status: 'sending', data: { userOp } }))
  log('Sending UserOperation')
  const hash = await sendUserOpActivity(userOp)
  if (!hash) throw ApplicationFailure.nonRetryable('No hash returned from sendUserOperation')
  log('UserOperation sent, hash:', hash)
  setHandler(getTransferStateQuery, () => ({ status: 'waiting', data: { userOp, hash } }))
  const receipt = await waitForTransactionReceiptActivity(hash)
  if (!receipt)
    throw ApplicationFailure.nonRetryable('No receipt returned from waitForTransactionReceipt')
  log('Receipt received:', superjson.stringify(receipt))
  setHandler(getTransferStateQuery, () => ({ status: 'indexing', data: { userOp, receipt } }))
  const transfer = await isTransferIndexedActivity(receipt.userOpHash)
  if (!transfer) throw ApplicationFailure.retryable('Transfer not yet indexed in db')
  log('Transfer indexed:', superjson.stringify(transfer))
  setHandler(getTransferStateQuery, () => ({ status: 'confirmed', data: { userOp, receipt } }))
  return transfer
}
