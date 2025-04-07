import { proxyActivities, workflowInfo, log, ApplicationFailure } from '@temporalio/workflow'
import type { createTransferActivities } from './activities'
import type { UserOperation } from 'permissionless'
import superjson from 'superjson'
import debug from 'debug'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { createUserOpActivities } from '../userop-workflow/activities'

const debugLog = debug('workflows:transfer')

const {
  upsertTemporalSendAccountTransferActivity,
  decodeTransferUserOpActivity,
  updateTemporalSendAccountTransferActivity,
  getEventFromTransferActivity,
} = proxyActivities<ReturnType<typeof createTransferActivities>>({
  // TODO: make this configurable
  startToCloseTimeout: '10 minutes',
  retry: {
    maximumAttempts: 20,
  },
})

const {
  simulateUserOperationActivity,
  getBaseBlockNumberActivity,
  sendUserOpActivity,
  waitForTransactionReceiptActivity,
} = proxyActivities<ReturnType<typeof createUserOpActivities>>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 20,
  },
})

export async function transfer(userOp: UserOperation<'v0.7'>, note?: string) {
  const workflowId = workflowInfo().workflowId
  debugLog('Starting SendTransfer Workflow with userOp:', workflowId)
  await upsertTemporalSendAccountTransferActivity({
    workflow_id: workflowId,
    data: {
      sender: hexToBytea(userOp.sender),
    },
  })

  debugLog('Simulating transfer', workflowId)
  const _ = await simulateUserOperationActivity(userOp).catch(async (error) => {
    log.error('simulateUserOperationActivity failed', { error })
    await updateTemporalSendAccountTransferActivity({
      workflow_id: workflowId,
      status: 'failed',
    })
    throw ApplicationFailure.nonRetryable(
      'Error simulating user operation',
      error.code,
      error.details
    )
  })
  debugLog('Successfully simulated transfer', workflowId)

  debugLog('Decoding transfer userOp', workflowId)
  const { token, from, to, amount } = await decodeTransferUserOpActivity(workflowId, userOp)
  debugLog('Decoded transfer userOp', { workflowId, token, from, to, amount: amount.toString() })

  debugLog('Getting latest base block', workflowId)
  const createdAtBlockNum = await getBaseBlockNumberActivity()
  debugLog('Base block:', { workflowId, createdAtBlockNum: createdAtBlockNum.toString() })

  debugLog('Inserting temporal transfer into temporal.send_account_transfers', workflowId)
  const submittedTransfer = token
    ? await updateTemporalSendAccountTransferActivity({
        workflow_id: workflowId,
        status: 'submitted',
        created_at_block_num: createdAtBlockNum ? Number(createdAtBlockNum) : null,
        data: {
          f: hexToBytea(from),
          t: hexToBytea(to),
          v: amount.toString(),
          log_addr: hexToBytea(token),
          note,
        },
      })
    : await updateTemporalSendAccountTransferActivity({
        workflow_id: workflowId,
        status: 'submitted',
        created_at_block_num: createdAtBlockNum ? Number(createdAtBlockNum) : null,
        data: {
          sender: hexToBytea(from),
          value: amount.toString(),
          log_addr: hexToBytea(to),
          note,
        },
      })
  debugLog('Inserted temporal transfer into temporal.send_account_transfers', workflowId)

  debugLog('Sending UserOperation', superjson.stringify(userOp))
  const hash = await sendUserOpActivity(userOp).catch(async (error) => {
    log.error('sendUserOpActivity failed', { error })
    await updateTemporalSendAccountTransferActivity({
      workflow_id: workflowId,
      status: 'failed',
    })
    throw ApplicationFailure.nonRetryable('Error sending user operation', error.code, error.details)
  })
  debugLog('UserOperation sent, hash:', hash)
  const sentTransfer = await updateTemporalSendAccountTransferActivity({
    workflow_id: workflowId,
    status: 'sent',
    data: {
      ...(submittedTransfer.data as Record<string, unknown>),
      user_op_hash: hash,
    },
  })

  const bundlerReceipt = await waitForTransactionReceiptActivity(hash).catch(async (error) => {
    log.error('waitForTransactionReceiptActivity failed', { error })
    await updateTemporalSendAccountTransferActivity({
      workflow_id: workflowId,
      status: 'failed',
    })
    throw ApplicationFailure.nonRetryable('Error sending user operation', error.code, error.details)
  })
  debugLog('Receipt received:', { tx_hash: bundlerReceipt.receipt.transactionHash })

  const { eventName, eventId } = await getEventFromTransferActivity({
    bundlerReceipt,
    token,
    from,
    to,
  })

  await updateTemporalSendAccountTransferActivity({
    workflow_id: workflowId,
    status: 'confirmed',
    data: {
      ...(sentTransfer.data as Record<string, unknown>),
      tx_hash: hexToBytea(bundlerReceipt.receipt.transactionHash),
      block_num: bundlerReceipt.receipt.blockNumber.toString(),
      event_name: eventName,
      event_id: eventId,
    },
  })
  return hash
}
