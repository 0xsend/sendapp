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
  // Intent-based activities
  getChainIdActivity,
  upsertTransferIntentActivity,
  updateTransferIntentActivity,
  upsertTransferReconciliationActivity,
} = proxyActivities<ReturnType<typeof createTransferActivities>>({
  // TODO: make this configurable
  startToCloseTimeout: '1 minute',
  retry: {
    maximumAttempts: 10,
  },
})

const { simulateUserOperationActivity, getBaseBlockNumberActivity, sendUserOpActivity } =
  proxyActivities<ReturnType<typeof createUserOpActivities>>({
    startToCloseTimeout: '20 seconds',
    retry: {
      maximumAttempts: 6,
    },
  })

const { waitForTransactionReceiptActivity } = proxyActivities<
  ReturnType<typeof createUserOpActivities>
>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
    backoffCoefficient: 1.5,
    initialInterval: '10 seconds',
    maximumInterval: '60 seconds',
  },
})

export async function transfer(userOp: UserOperation<'v0.7'>, note?: string) {
  const workflowId = workflowInfo().workflowId
  debugLog('Starting SendTransfer Workflow with userOp:', workflowId)

  // Get chain ID for intent tracking
  const chainId = await getChainIdActivity()

  // Legacy: Initialize temporal.send_account_transfers (for backwards compatibility)
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

  // ==========================================================================
  // Intent-first write: Create transfer_intent with 'pending' status
  // ==========================================================================
  debugLog('Creating transfer intent with pending status', workflowId)
  const pendingIntent = await upsertTransferIntentActivity({
    workflow_id: workflowId,
    status: 'pending',
    from_address: hexToBytea(from),
    to_address: hexToBytea(to),
    token_address: token ? hexToBytea(token) : null,
    amount: Number(amount),
    chain_id: chainId,
    note,
    data: {
      created_at_block_num: createdAtBlockNum ? Number(createdAtBlockNum) : null,
    },
  })
  debugLog('Created transfer intent', { workflowId, intentId: pendingIntent.id })

  // Legacy: Update temporal.send_account_transfers to submitted
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

  // ==========================================================================
  // Intent update: Mark as 'submitted' before sending to chain
  // ==========================================================================
  debugLog('Updating transfer intent to submitted status', workflowId)
  await updateTransferIntentActivity({
    workflow_id: workflowId,
    status: 'submitted',
  })

  debugLog('Sending UserOperation', superjson.stringify(userOp))
  const hash = await sendUserOpActivity(userOp).catch(async (error) => {
    log.error('sendUserOpActivity failed', { error })
    // Update both legacy and intent tables on failure
    await updateTemporalSendAccountTransferActivity({
      workflow_id: workflowId,
      status: 'failed',
    })
    await updateTransferIntentActivity({
      workflow_id: workflowId,
      status: 'failed',
      error_message: error.message || 'Error sending user operation',
    })
    throw ApplicationFailure.nonRetryable('Error sending user operation', error.code, error.details)
  })
  debugLog('UserOperation sent, hash:', hash)

  // Legacy: Update temporal.send_account_transfers to sent
  const sentTransfer = await updateTemporalSendAccountTransferActivity({
    workflow_id: workflowId,
    status: 'sent',
    data: {
      ...(submittedTransfer.data as Record<string, unknown>),
      user_op_hash: hash,
    },
  })

  // ==========================================================================
  // Intent update: Mark as 'submitted' with user_op_hash (sent to chain)
  // Note: We keep status as 'submitted' since transaction is not yet confirmed
  // ==========================================================================
  debugLog('Updating transfer intent with user_op_hash', workflowId)
  await updateTransferIntentActivity({
    workflow_id: workflowId,
    user_op_hash: hash,
  })

  const bundlerReceipt = await waitForTransactionReceiptActivity(hash, userOp.sender).catch(
    async (error) => {
      log.error('waitForTransactionReceiptActivity failed', { error })
      // Update both legacy and intent tables on failure
      await updateTemporalSendAccountTransferActivity({
        workflow_id: workflowId,
        status: 'failed',
      })
      await updateTransferIntentActivity({
        workflow_id: workflowId,
        status: 'failed',
        error_message: error.message || 'Error waiting for transaction receipt',
      })
      throw ApplicationFailure.nonRetryable(
        'Error sending user operation',
        error.code,
        error.details
      )
    }
  )
  debugLog('Receipt received:', { tx_hash: bundlerReceipt.receipt.transactionHash })

  const { eventName, eventId, logIdx } = await getEventFromTransferActivity({
    bundlerReceipt,
    token,
    from,
    to,
  })

  // Legacy: Update temporal.send_account_transfers to confirmed
  await updateTemporalSendAccountTransferActivity({
    workflow_id: workflowId,
    status: 'confirmed',
    send_account_transfers_activity_event_id: eventId,
    send_account_transfers_activity_event_name: eventName,
    data: {
      ...(sentTransfer.data as Record<string, unknown>),
      tx_hash: hexToBytea(bundlerReceipt.receipt.transactionHash),
      block_num: bundlerReceipt.receipt.blockNumber.toString(),
      event_name: eventName,
      event_id: eventId,
    },
  })

  // ==========================================================================
  // Intent update: Mark as 'confirmed' with deterministic on-chain identifiers
  // ==========================================================================
  debugLog('Updating transfer intent to confirmed status', workflowId)
  const confirmedIntent = await updateTransferIntentActivity({
    workflow_id: workflowId,
    status: 'confirmed',
    tx_hash: hexToBytea(bundlerReceipt.receipt.transactionHash),
    data: {
      ...(pendingIntent.data as Record<string, unknown> | null),
      block_num: bundlerReceipt.receipt.blockNumber.toString(),
      event_name: eventName,
      event_id: eventId,
    },
  })

  // ==========================================================================
  // Create transfer reconciliation linking intent to on-chain event
  // Uses (chain_id, tx_hash, log_idx) as collision invariant
  // ==========================================================================
  debugLog('Creating transfer reconciliation', workflowId)
  await upsertTransferReconciliationActivity({
    intent_id: confirmedIntent.id,
    chain_id: chainId,
    tx_hash: hexToBytea(bundlerReceipt.receipt.transactionHash),
    log_idx: logIdx,
    block_num: Number(bundlerReceipt.receipt.blockNumber),
    block_time: Math.floor(Date.now() / 1000), // Use current time as approximation
    event_id: eventId,
  })
  debugLog('Created transfer reconciliation', { workflowId, intentId: confirmedIntent.id })

  return hash
}
