import { proxyActivities, workflowInfo, log, ApplicationFailure } from '@temporalio/workflow'
import type { createTransferActivities, IndexedTransfer } from './activities'
import type { GetUserOperationReceiptReturnType, UserOperation } from 'permissionless'
import superjson from 'superjson'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { createUserOpActivities } from '../userop-workflow/activities'
import { byteaToHex } from 'app/utils/byteaToHex'

const {
  upsertTemporalSendAccountTransferActivity,
  decodeTransferUserOpActivity,
  updateTemporalSendAccountTransferActivity,
  getUserIdByAddressActivity,
  insertEthTransferActivity,
  insertTransferEventActivity,
} = proxyActivities<ReturnType<typeof createTransferActivities>>({
  // TODO: make this configurable
  startToCloseTimeout: '10 minutes',
  retry: {
    maximumAttempts: 20,
  },
})

const {
  simulateUserOperationActivity,
  sendUserOpActivity,
  getBaseBlockActivity,
  getUserOperationReceiptActivity,
} = proxyActivities<ReturnType<typeof createUserOpActivities>>({
  startToCloseTimeout: '2 minutes',
  retry: {
    maximumAttempts: 20,
  },
})

export async function transfer(userOp: UserOperation<'v0.7'>, note?: string) {
  const workflowId = workflowInfo().workflowId
  log.debug('Starting SendTransfer Workflow with userOp:', { workflowId })

  await upsertTemporalSendAccountTransferActivity({
    workflow_id: workflowId,
    nonce: Number(userOp.nonce),
    data: {
      sender: hexToBytea(userOp.sender),
    },
  })

  try {
    log.debug('Simulating transfer', { workflowId })
    const _ = await simulateUserOperationActivity(userOp)
    log.debug('Successfully simulated transfer', { workflowId })

    log.debug('Decoding transfer userOp', { workflowId })
    const {
      token,
      from: sender,
      to: recipient,
      amount,
    } = await decodeTransferUserOpActivity(workflowId, userOp)
    log.debug('Decoded transfer userOp', {
      workflowId,
      token,
      sender,
      recipient,
      amount: amount.toString(),
    })

    log.debug('Getting userIds for sender and recipient', { workflowId })
    const [senderUserId, recipientUserId] = await getUserIdByAddressActivity({
      workflowId,
      addresses: [sender, recipient],
    })
    log.debug('userIds found', { workflowId, senderUserId, recipientUserId })

    log.debug('Inserting temporal transfer into temporal.send_account_transfers', { workflowId })
    const submittedTransfer = token
      ? await updateTemporalSendAccountTransferActivity({
          workflow_id: workflowId,
          status: 'submitted',
          data: {
            f: hexToBytea(sender),
            t: hexToBytea(recipient),
            v: amount.toString(),
            log_addr: hexToBytea(token),
            nonce: userOp.nonce.toString(),
            note,
          },
        })
      : await updateTemporalSendAccountTransferActivity({
          workflow_id: workflowId,
          status: 'submitted',
          data: {
            sender: hexToBytea(sender),
            value: amount.toString(),
            log_addr: hexToBytea(recipient),
            nonce: userOp.nonce.toString(),
            note,
          },
        })
    log.debug(
      'Updated temporal transfer status to submitted into temporal.send_account_transfers',
      { workflowId }
    )

    log.debug('Sending UserOperation', { userOp: superjson.stringify(userOp) })
    const hash = await sendUserOpActivity(userOp)
    log.debug('UserOperation sent, hash:', { hash })

    const sentTransfer = await updateTemporalSendAccountTransferActivity({
      workflow_id: workflowId,
      status: 'sent',
      data: {
        ...(submittedTransfer.data as Record<string, unknown>),
        user_op_hash: hash,
      },
    })
    log.debug('Finding the new indexed transfer in the database', { workflowId })

    const bundlerReceipt = await getUserOperationReceiptActivity({
      hash: byteaToHex(hash),
    })

    if (!bundlerReceipt.success) {
      throw ApplicationFailure.nonRetryable(
        `Transaction failed: ${bundlerReceipt.receipt.transactionHash}`
      )
    }

    await updateTemporalSendAccountTransferActivity({
      workflow_id: workflowId,
      status: 'confirmed',
      data: {
        ...(sentTransfer.data as Record<string, unknown>),
        tx_hash: bundlerReceipt.receipt.transactionHash,
        block_num: bundlerReceipt.receipt.blockNumber.toString(),
      },
    })

    const block = await getBaseBlockActivity({
      blockHash: bundlerReceipt.receipt.blockHash,
    })

    if (!token && !recipientUserId) {
      await insertEthTransferActivity({
        bundlerReceipt,
        recipient,
        sender,
        amount,
        blockTime: block.timestamp,
      })
    }

    log.debug('Inserting indexed transfers events into activity table', { workflowId })
    await insertTransferEventActivity({
      workflowId,
      senderUserId,
      recipientUserId,
      bundlerReceipt,
      note,
      token,
      sender,
      recipient,
      amount,
      blockTime: block.timestamp,
    })

    return hash
  } catch (error) {
    log.error('Workflow failed', { error })

    // Ensure error is an ApplicationFailure for Temporal
    const failure =
      error instanceof ApplicationFailure
        ? error
        : ApplicationFailure.nonRetryable(
            error.message ?? 'Unknown workflow error',
            error.name ?? 'WorkflowFailure',
            error
          )

    // Attempt to update the database record to 'failed' status
    try {
      log.error(`Attempting to update transfer status to 'failed' in DB`)
      await updateTemporalSendAccountTransferActivity({
        workflow_id: workflowId,
        status: 'failed',
      })
      log.error(`Successfully updated transfer status to 'failed'`)
    } catch (dbError) {
      // Log the error during the failure update, but don't mask the original workflow error
      log.error(
        // Reverted to log.error
        `CRITICAL: Failed to update transfer status to 'failed' after workflow error:`,
        dbError
      )
    }

    // Rethrow the original error to fail the workflow run
    throw failure
  }
}
