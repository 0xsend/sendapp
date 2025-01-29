import {
  proxyActivities,
  ApplicationFailure,
  defineQuery,
  workflowInfo,
} from '@temporalio/workflow'
import type { createTransferActivities } from './activities'
import type { UserOperation, GetUserOperationReceiptReturnType } from 'permissionless'
import debug from 'debug'

const log = debug('workflows:transfer')

const {
  getUserOpByHashActivity,
  decodeTransferCallDataActivity,
  simulateUserOpActivity,
  sendUserOpActivity,
  waitForTransactionReceiptActivity,
  isTransferIndexedActivity,
} = proxyActivities<ReturnType<typeof createTransferActivities>>({
  // TODO: make this configurable
  startToCloseTimeout: '45 seconds',
})

type BaseState = { userOp: UserOperation<'v0.7'> }
type Sending = { status: 'sending' } & BaseState
type Waiting = { status: 'waiting'; hash: string } & BaseState
type Indexing = {
  status: 'indexing'
  receipt: GetUserOperationReceiptReturnType
} & BaseState
type Confirmed = {
  status: 'confirmed'
  receipt: GetUserOperationReceiptReturnType | boolean
} & BaseState

export type transferState = Sending | Waiting | Indexing | Confirmed

export const getTransferStateQuery = defineQuery<transferState>('getTransferState')

export async function TransferWorkflow(userId: string, userOpHash: `0x${string}`) {
  const [userId, userOpHash] = workflowId.split('-')
  log('SendTransferWorkflow started with hash:', userOpHash)
  const userOp = await getUserOpByHashActivity(userOpHash)
  const data = await decodeTransferCallDataActivity(userOp.callData)
  await simulateUserOpActivity(userOp)
  log('Simulation completed')
  log('Sending UserOperation')
  const hash = await sendUserOpActivity(userOp)
  log('UserOperation sent, hash:', hash)
  const receipt = await waitForTransactionReceiptActivity(hash)
  // log('Receipt received:', superjson.stringify(receipt))
  const transfer = await isTransferIndexedActivity(receipt.receipt.transactionHash)
  // log('Transfer indexed:', superjson.stringify(transfer))
  return transfer
}
