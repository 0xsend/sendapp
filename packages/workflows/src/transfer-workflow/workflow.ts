import { proxyActivities, workflowInfo } from '@temporalio/workflow'
import type { createTransferActivities } from './activities'
import type { UserOperation } from 'permissionless'
import superjson from 'superjson'
import debug from 'debug'
import { hexToBytea } from 'app/utils/hexToBytea'

const log = debug('workflows:transfer')

const {
  simulateTransferActivity,
  getBaseBlockNumberActivity,
  decodeTransferUserOpActivity,
  insertTemporalSendAccountTransferActivity,
  sendUserOpActivity,
  updateTemporalTransferActivity,
  waitForTransactionReceiptActivity,
} = proxyActivities<ReturnType<typeof createTransferActivities>>({
  // TODO: make this configurable
  startToCloseTimeout: '10 minutes',
})

export async function TransferWorkflow(userOp: UserOperation<'v0.7'>) {
  const workflowId = workflowInfo().workflowId
  log('Starting SendTransfer Workflow with userOp:', workflowId)

  log('Simulating transfer', workflowId)
  await simulateTransferActivity(userOp)
  log('Successfully simulated transfer', workflowId)

  log('Getting latest base block', workflowId)
  const blockNumber = await getBaseBlockNumberActivity()
  log('Base block:', { workflowId, blockNumber: blockNumber.toString() })

  log('Decoding transfer userOp', workflowId)
  const { token, from, to, amount } = await decodeTransferUserOpActivity(userOp)
  log('Decoded transfer userOp', { workflowId, token, from, to, amount: amount.toString() })

  log('Inserting temporal transfer into temporal.send_account_transfers', workflowId)
  const initialTransfer = await insertTemporalSendAccountTransferActivity(
    workflowId,
    from,
    to,
    amount,
    token,
    blockNumber
  )
  log('Inserted temporal transfer into temporal.send_account_transfers', workflowId)

  log('Sending UserOperation', superjson.stringify(userOp))
  const hash = await sendUserOpActivity(workflowId, userOp)
  log('UserOperation sent, hash:', hash)
  const sentTransfer = await updateTemporalTransferActivity({
    workflowId,
    status: 'sent',
    data: {
      ...(initialTransfer.data as Record<string, unknown>),
      user_op_hash: hash,
    },
  })

  const receipt = await waitForTransactionReceiptActivity(workflowId, hash)
  log('Receipt received:', { tx_hash: receipt.transactionHash })

  await updateTemporalTransferActivity({
    workflowId,
    status: 'confirmed',
    data: {
      ...(sentTransfer.data as Record<string, unknown>),
      tx_hash: hexToBytea(receipt.transactionHash),
      block_num: receipt.blockNumber.toString(),
    },
  })
  return hash
}
