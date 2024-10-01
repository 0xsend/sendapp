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
  receipt: GetUserOperationReceiptReturnType | boolean
} & BaseState

export type transferState = Simulating | Sending | Waiting | Indexing | Confirmed

export const getTransferStateQuery = defineQuery<transferState>('getTransferState')

export const SendTransferWorkflow = Object.defineProperty(
  async function SendTransferWorkflow(
    userOp: UserOperation<'v0.7'> | { json: UserOperation<'v0.7'> }
  ) {
    let parsedUserOp: UserOperation<'v0.7'>

    if ('json' in userOp) {
      console.log('Received userOp.json:', JSON.stringify(userOp.json, null, 2))
      parsedUserOp = userOp.json
    } else {
      parsedUserOp = userOp
    }

    log('SendTransferWorkflow started with userOp:', JSON.stringify(parsedUserOp, null, 2))
    setHandler(getTransferStateQuery, () => ({ status: 'simulating', userOp: parsedUserOp }))
    await simulateUserOpActivity(parsedUserOp)
    log('Simulation completed')
    setHandler(getTransferStateQuery, () => ({ status: 'sending', userOp: parsedUserOp }))
    log('Sending UserOperation')
    const hash = await sendUserOpActivity(parsedUserOp)
    if (!hash) throw ApplicationFailure.nonRetryable('No hash returned from sendUserOperation')
    log('UserOperation sent, hash:', hash)
    setHandler(getTransferStateQuery, () => ({ status: 'waiting', userOp: parsedUserOp, hash }))
    const receipt = await waitForTransactionReceiptActivity(hash)
    if (!receipt)
      throw ApplicationFailure.nonRetryable('No receipt returned from waitForTransactionReceipt')
    log('Receipt received:', superjson.stringify(receipt))
    setHandler(getTransferStateQuery, () => ({ status: 'indexing', userOp: parsedUserOp, receipt }))
    const transfer = await isTransferIndexedActivity(receipt.receipt.transactionHash)
    if (!transfer) throw ApplicationFailure.retryable('Transfer not yet indexed in db')
    log('Transfer indexed:', superjson.stringify(transfer))
    setHandler(getTransferStateQuery, () => ({
      status: 'confirmed',
      userOp: parsedUserOp,
      receipt: transfer,
    }))
    return transfer
  },
  'name',
  { value: 'SendTransferWorkflow', writable: false, enumerable: false, configurable: true }
)
