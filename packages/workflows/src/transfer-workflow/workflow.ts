import { proxyActivities, workflowInfo } from '@temporalio/workflow'
import type { createTransferActivities } from './activities'

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

export async function TransferWorkflow(userOpHash: `0x${string}`) {
  const workflowId = workflowInfo().workflowId
  log('SendTransferWorkflow started with hash:', userOpHash)
  const { userOp, token } = await initializeTransferActivity(workflowId, userOpHash)
  log('Sending UserOperation')
  const hash = await sendUserOpActivity(userOp)
  log('UserOperation sent, hash:', hash)
  await updateTemporalTransferSentStatusActivity(workflowId)
  const receipt = await waitForTransactionReceiptActivity(workflowId, hash)
  log('Receipt received:', { tx_hash: receipt.transactionHash, user_op_hash: userOpHash })
  const transfer = await isTransferIndexedActivity(workflowId, receipt.transactionHash, token)
  log('Transfer indexed')
  return transfer
}
