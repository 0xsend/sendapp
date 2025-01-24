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
  saveNote,
} = proxyActivities<ReturnType<typeof createTransferActivities>>({
  // TODO: make this configurable
  startToCloseTimeout: '45 seconds',
})

type BaseState = { userOp: UserOperation<'v0.7'> }

type Simulating = { status: 'simulating' } & BaseState
type Sending = { status: 'sending' } & BaseState
type Waiting = { status: 'waiting'; hash: string } & BaseState
type SavingNote = {
  status: 'saving_note'
  receipt: GetUserOperationReceiptReturnType
} & BaseState
type Indexing = {
  status: 'indexing'
  receipt: GetUserOperationReceiptReturnType
} & BaseState
type Confirmed = {
  status: 'confirmed'
  receipt: GetUserOperationReceiptReturnType | boolean
} & BaseState

export type transferState = Simulating | Sending | Waiting | SavingNote | Indexing | Confirmed

export const getTransferStateQuery = defineQuery<transferState>('getTransferState')

export async function TransferWorkflow(userOp: UserOperation<'v0.7'>, noteToSave?: string) {
  setHandler(getTransferStateQuery, () => ({ status: 'simulating', userOp }))
  log('SendTransferWorkflow started with userOp:', superjson.stringify(userOp), noteToSave)
  await simulateUserOpActivity(userOp)
  log('Simulation completed')
  setHandler(getTransferStateQuery, () => ({ status: 'sending', userOp }))
  log('Sending UserOperation')
  const hash = await sendUserOpActivity(userOp)
  if (!hash) throw ApplicationFailure.nonRetryable('No hash returned from sendUserOperation')
  log('UserOperation sent, hash:', hash)
  setHandler(getTransferStateQuery, () => ({ status: 'waiting', userOp, hash }))
  const receipt = await waitForTransactionReceiptActivity(hash)
  if (!receipt)
    throw ApplicationFailure.nonRetryable('No receipt returned from waitForTransactionReceipt')
  log('Receipt received:', superjson.stringify(receipt))
  setHandler(getTransferStateQuery, () => ({ status: 'indexing', userOp, receipt }))
  const transfer = await isTransferIndexedActivity(receipt.receipt.transactionHash)
  if (!transfer) throw ApplicationFailure.retryable('Transfer not yet indexed in db')
  log('Transfer indexed:', superjson.stringify(transfer))

  setHandler(getTransferStateQuery, () => ({
    status: 'saving_note',
    userOp,
    receipt,
  }))
  if (noteToSave) {
    const savedNote = await saveNote(receipt, noteToSave)
    if (!savedNote) {
      // TODO how to tell temporal that it should retry and where, here or deeper
    }
    log('Note saved:', superjson.stringify(savedNote))
  } else {
    log('Skipped saving note, note not defined')
  }

  setHandler(getTransferStateQuery, () => ({ status: 'confirmed', userOp, receipt }))
  return transfer
}
