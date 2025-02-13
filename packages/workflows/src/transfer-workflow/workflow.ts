import { ApplicationFailure, proxyActivities, workflowInfo } from '@temporalio/workflow'
import type { createTransferActivities } from './activities'
import type { UserOperation } from 'permissionless'
import superjson from 'superjson'

import debug from 'debug'

const log = debug('workflows:transfer')

const {
  initializeTransferActivity,
  insertTemporalSendAccountTransfer,
  sendUserOpActivity,
  updateTemporalTransferActivity,
  waitForTransactionReceiptActivity,
  isTransferIndexedActivity,
  deleteTemporalTransferActivity,
} = proxyActivities<ReturnType<typeof createTransferActivities>>({
  // TODO: make this configurable
  startToCloseTimeout: '10 minutes',
})

export async function TransferWorkflow(userOp: UserOperation<'v0.7'>) {
  const workflowId = workflowInfo().workflowId
  log('SendTransferWorkflow Initializing with userOp:', workflowId)
  const { token, from, to, amount } = await initializeTransferActivity(userOp)

  log('Inserting temporal transfer into temporal.send_account_transfers', workflowId)
  await insertTemporalSendAccountTransfer(workflowId, from, to, amount, token)

  log('Sending UserOperation', superjson.stringify(userOp))
  const { hash, hashBytea } = await sendUserOpActivity(workflowId, userOp)
  log('UserOperation sent, hash:', hash)
  await updateTemporalTransferActivity({
    workflowId,
    status: 'sent',
    data: { user_op_hash: hashBytea },
  })

  const receipt = await waitForTransactionReceiptActivity(workflowId, hash)
  log('Receipt received:', { tx_hash: receipt.transactionHash })

  await updateTemporalTransferActivity({
    workflowId,
    status: 'confirmed',
    data: {
      tx_hash: receipt.transactionHash,
      block_num: receipt.blockNumber.toString(),
    },
  })

  await isTransferIndexedActivity(receipt.transactionHash, token)
  await updateTemporalTransferActivity({
    workflowId,
    status: 'indexed',
  })

  log('Transfer indexed')
  await deleteTemporalTransferActivity(workflowId)
  return workflowId
}
