import { ApplicationFailure, proxyActivities, workflowInfo, log } from '@temporalio/workflow'
import type { createSendPotPurchaseTicketsActivities } from './activities'
import type { UserOperation } from 'permissionless'
import superjson from 'superjson'
import debug from 'debug'
import { hexToBytea } from 'app/utils/hexToBytea'

const debugLog = debug('workflows:sendpot')

const {
  upsertTemporalSendPotTicketPurchasesActivity,
  simulateUserOperationActivity,
  getBaseBlockNumberActivity,
  decodeExecuteBatchCallDataActivity,
  decodeApproveTokenCallDataActivity,
  decodePurchaseTicketsCallDataActivity,
  updateTemporalSendPotTicketPurchasesActivity,
  sendUserOpActivity,
  waitForTransactionReceiptActivity,
} = proxyActivities<ReturnType<typeof createSendPotPurchaseTicketsActivities>>({
  // TODO: make this configurablea
  startToCloseTimeout: '10 minutes',
})

export async function purchaseTickets(userOp: UserOperation<'v0.7'>) {
  const workflowId = workflowInfo().workflowId
  debugLog('Starting SendTransfer Workflow with userOp:', workflowId)
  await upsertTemporalSendPotTicketPurchasesActivity({
    workflowId,
    data: {
      sender: hexToBytea(userOp.sender),
    },
  })

  debugLog('Simulating transfer', workflowId)
  const _ = await simulateUserOperationActivity(userOp).catch(async (error) => {
    log.error('simulateUserOperationActivity failed', { error })
    await updateTemporalSendPotTicketPurchasesActivity({
      workflow_id: workflowId,
      status: 'failed',
    })
    throw ApplicationFailure.nonRetryable('Error simulating user operation', error.code, error)
  })
  debugLog('Successfully simulated transfer', workflowId)

  debugLog('Getting latest base block', workflowId)
  const createdAtBlockNum = await getBaseBlockNumberActivity()
  debugLog('Base block:', { workflowId, createdAtBlockNum: createdAtBlockNum.toString() })

  debugLog('Decoding transfer userOp', workflowId)
  const { args } = await decodeExecuteBatchCallDataActivity(userOp.callData).catch(
    async (error) => {
      log.error('decodeExecuteBatchCallDataActivity failed', { error })
      await updateTemporalSendPotTicketPurchasesActivity({
        workflow_id: workflowId,
        status: 'failed',
      })
      throw ApplicationFailure.nonRetryable(
        'Error decoding executeBatch calldata',
        error.code,
        error
      )
    }
  )
  const {
    functionName: approveFunctionName,
    spender,
    value,
  } = await decodeApproveTokenCallDataActivity(args[0][0].data).catch(async (error) => {
    log.error('decodeApproveTokenCallDataActivity failed', { error, args })
    await updateTemporalSendPotTicketPurchasesActivity({
      workflow_id: workflowId,
      status: 'failed',
    })
    throw ApplicationFailure.nonRetryable('Error decoding approveToken calldata', error.code, error)
  })
  debugLog('Decoded approve token userOp', {
    workflowId,
    spender,
    value: value?.toString(),
  })

  debugLog('Inserting temporal transfer into temporal.send_account_transfers', workflowId)
  const {
    functionName: ticketPurchaseFunctionName,
    referrer,
    value: ticketPrice,
    recipient,
    buyer,
  } = await decodePurchaseTicketsCallDataActivity(args[0][1].data).catch(async (error) => {
    log.error('decodePurchaseTicketsCallDataActivity failed', { error })
    await updateTemporalSendPotTicketPurchasesActivity({
      workflow_id: workflowId,
      status: 'failed',
    })
    throw ApplicationFailure.nonRetryable(
      'Error decoding purchaseTickets calldata',
      error.code,
      error
    )
  })
  debugLog('Decoded purchaseTickets userOp', {
    workflowId,
    referrer,
    ticketPrice: ticketPrice?.toString(),
    recipient,
    buyer,
  })

  const submittedTicketPurchase = await updateTemporalSendPotTicketPurchasesActivity({
    workflowId,
    status: 'submitted',
    createdAtBlockNum,
    data: [
      {
        functionName: approveFunctionName,
        spender,
        value,
      },
      {
        functionName: ticketPurchaseFunctionName,
        referrer,
        value: ticketPrice,
        recipient,
        buyer,
      },
    ],
  })
  debugLog('Inserted temporal transfer into temporal.send_account_transfers', workflowId)

  debugLog('Sending UserOperation', superjson.stringify(userOp))
  const hash = await sendUserOpActivity(userOp).catch(async (error) => {
    log.error('sendUserOpActivity failed', { error })
    await updateTemporalSendPotTicketPurchasesActivity({
      workflow_id: workflowId,
      status: 'failed',
    })
    throw ApplicationFailure.nonRetryable('Error sending user operation', error.code, error)
  })
  debugLog('UserOperation sent, hash:', hash)
  const sentTicketPurchases = await updateTemporalSendPotTicketPurchasesActivity({
    workflowId,
    status: 'sent',
    data: {
      ...(submittedTicketPurchase.data as Record<string, unknown>),
      user_op_hash: hash,
    },
  })

  const receipt = await waitForTransactionReceiptActivity(hash).catch(async (error) => {
    log.error('waitForTransactionReceiptActivity failed', { error })
    await upsertTemporalSendPotTicketPurchasesActivity({
      workflow_id: workflowId,
      status: 'failed',
    })

    throw ApplicationFailure.nonRetryable('Error sending user operation', error.code, error)
  })
  debugLog('Receipt received:', { tx_hash: receipt.transactionHash })

  await updateTemporalSendPotTicketPurchasesActivity({
    workflowId,
    status: 'confirmed',
    data: {
      ...(sentTicketPurchases.data as Record<string, unknown>),
      tx_hash: hexToBytea(receipt.transactionHash),
      block_num: receipt.blockNumber.toString(),
    },
  })
  return hash
}
