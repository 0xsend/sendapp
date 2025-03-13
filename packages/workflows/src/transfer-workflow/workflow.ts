import { proxyActivities, workflowInfo } from '@temporalio/workflow'
import type { createTransferActivities } from './activities'
import type { UserOperation } from 'permissionless'
import superjson from 'superjson'
import debug from 'debug'
import { hexToBytea } from 'app/utils/hexToBytea'

const log = debug('workflows:transfer')

const {
  upsertTemporalSendAccountTransferActivity,
  simulateTransferActivity,
  getBaseBlockNumberActivity,
  decodeTransferUserOpActivity,
  updateTemporalSendAccountTransferActivity,
  sendUserOpActivity,
  waitForTransactionReceiptActivity,
} = proxyActivities<ReturnType<typeof createTransferActivities>>({
  // TODO: make this configurablea
  startToCloseTimeout: '10 minutes',
})

export async function TransferWorkflow(userOp: UserOperation<'v0.7'>) {
  const workflowId = workflowInfo().workflowId
  log('Starting SendTransfer Workflow with userOp:', workflowId)
  await upsertTemporalSendAccountTransferActivity({
    workflowId,
    data: {
      sender: hexToBytea(userOp.sender),
    },
  })

  log('Simulating transfer', workflowId)
  const _ = await simulateTransferActivity(workflowId, userOp)
  log('Successfully simulated transfer', workflowId)

  log('Getting latest base block', workflowId)
  const createdAtBlockNum = await getBaseBlockNumberActivity()
  log('Base block:', { workflowId, createdAtBlockNum: createdAtBlockNum.toString() })

  log('Decoding transfer userOp', workflowId)
  const { token, from, to, amount } = await decodeTransferUserOpActivity(workflowId, userOp)
  log('Decoded transfer userOp', { workflowId, token, from, to, amount: amount.toString() })

  log('Inserting temporal transfer into temporal.send_account_transfers', workflowId)
  const submittedTransfer = token
    ? await updateTemporalSendAccountTransferActivity({
        workflowId,
        status: 'submitted',
        createdAtBlockNum,
        data: {
          f: from,
          t: to,
          v: amount.toString(),
          log_addr: token,
        },
      })
    : await updateTemporalSendAccountTransferActivity({
        workflowId,
        status: 'submitted',
        createdAtBlockNum,
        data: {
          sender: from,
          value: amount.toString(),
          log_addr: to,
        },
      })
  log('Inserted temporal transfer into temporal.send_account_transfers', workflowId)

  log('Sending UserOperation', superjson.stringify(userOp))
  const hash = await sendUserOpActivity(workflowId, userOp)
  log('UserOperation sent, hash:', hash)
  const sentTransfer = await updateTemporalSendAccountTransferActivity({
    workflowId,
    status: 'sent',
    data: {
      ...(submittedTransfer.data as Record<string, unknown>),
      user_op_hash: hash,
    },
  })

  const receipt = await waitForTransactionReceiptActivity(workflowId, hash)
  log('Receipt received:', { tx_hash: receipt.transactionHash })

  await updateTemporalSendAccountTransferActivity({
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
