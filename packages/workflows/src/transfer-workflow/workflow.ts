import { proxyActivities, workflowInfo } from '@temporalio/workflow'
import type { createTransferActivities } from './activities'
import type { UserOperation } from 'permissionless'

import debug from 'debug'

const log = debug('workflows:transfer')

const {
  initializeTransferActivity,
  sendUserOpActivity,
  updateTemporalTransferSentStatusActivity,
  waitForTransactionReceiptActivity,
  isTransferIndexedActivity,
} = proxyActivities<ReturnType<typeof createTransferActivities>>({
  // TODO: make this configurable
  startToCloseTimeout: '45 seconds',
})

export async function TransferWorkflow(userOp: UserOperation<'v0.7'>) {
  const workflowId = workflowInfo().workflowId
  log('SendTransferWorkflow started with userOp:', workflowId)
  const { token } = await initializeTransferActivity(workflowId, userOp)
  log('Sending UserOperation')
  const hash = await sendUserOpActivity(userOp)
  log('UserOperation sent, hash:', hash)
  await updateTemporalTransferSentStatusActivity(workflowId, hash)
  const receipt = await waitForTransactionReceiptActivity(workflowId, hash)
  log('Receipt received:', { tx_hash: receipt.transactionHash })
  const transfer = await isTransferIndexedActivity(workflowId, receipt.transactionHash, token)
  log('Transfer indexed')
  return transfer
}
