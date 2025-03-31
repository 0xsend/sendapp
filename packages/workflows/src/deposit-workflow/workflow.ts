import { ApplicationFailure, proxyActivities, workflowInfo } from '@temporalio/workflow'
import { hexToBytea } from 'app/utils/hexToBytea'
import debug from 'debug'
import type { UserOperation } from 'permissionless'
import type { createDepositActivities } from './createDepositActivities'

const log = debug('workflows:deposit')

const activities = proxyActivities<ReturnType<typeof createDepositActivities>>({
  startToCloseTimeout: '10 minutes',
})

interface DepositWorkflowInput {
  userOp: UserOperation<'v0.7'>
}

export async function DepositWorkflow({ userOp }: DepositWorkflowInput) {
  const { workflowId } = workflowInfo()
  log(`Starting SendEarn Deposit Workflow: ${workflowId}`)

  const { owner, assets, vault } = await activities.decodeDepositUserOpActivity(workflowId, userOp)

  try {
    // 1. Initialize record in the database with data passed from API
    log(
      `[${workflowId}] Initializing deposit record with owner=${owner}, assets=${assets}, vault=${vault}`
    )
    // Ensure the upsert activity accepts these fields directly
    await activities.upsertTemporalDepositActivity({
      workflow_id: workflowId,
      status: 'initialized',
      owner,
      assets,
      vault,
    })
    log(`[${workflowId}] Deposit record initialized`)

    // 2. Simulate the UserOperation
    log(`[${workflowId}] Simulating deposit UserOperation`)
    await activities.simulateDepositActivity(workflowId, userOp)
    log(`[${workflowId}] Simulation successful`)

    // 3. Update record status to 'submitted' (Decoding step removed)
    log(`[${workflowId}] Updating deposit record to 'submitted'`)
    await activities.updateTemporalDepositActivity({
      workflow_id: workflowId,
      status: 'submitted',
      // No need to update owner, assets, vault here as they were saved initially
    })
    log(`[${workflowId}] Deposit record updated to 'submitted'`)

    // 4. Send the UserOperation
    log(`[${workflowId}] Sending UserOperation`)
    const userOpHash = await activities.sendUserOpActivity(workflowId, userOp)
    log(`[${workflowId}] UserOperation sent, hash: ${userOpHash}`)

    // 5. Update record with UserOperation hash and 'sent' status
    log(`[${workflowId}] Updating deposit record to 'sent'`)
    await activities.updateTemporalDepositActivity({
      workflow_id: workflowId,
      status: 'sent',
      user_op_hash: userOpHash,
    })
    log(`[${workflowId}] Deposit record updated to 'sent'`)

    // 6. Wait for the transaction receipt
    log(`[${workflowId}] Waiting for transaction receipt for hash: ${userOpHash}`)
    const receipt = await activities.waitForTransactionReceiptActivity(workflowId, userOpHash)
    log(
      `[${workflowId}] Transaction receipt received: txHash=${receipt.transactionHash}, block=${receipt.blockNumber}`
    )

    // 7. Update record with transaction hash, block number, and 'confirmed' status
    log(`[${workflowId}] Updating deposit record to 'confirmed'`)
    await activities.updateTemporalDepositActivity({
      workflow_id: workflowId,
      status: 'confirmed',
      tx_hash: hexToBytea(receipt.transactionHash),
      // block_num: receipt.blockNumber, // Consider adding if needed and DB schema supports it
    })
    log(`[${workflowId}] Deposit record updated to 'confirmed'. Workflow complete.`)

    return userOpHash // Return the userOpHash on success
  } catch (error) {
    console.error(`[${workflowId}] Workflow failed:`, error)

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
      console.error(`[${workflowId}] Attempting to update deposit status to 'failed' in DB`)
      // Pass initial data again in case the first upsert failed but workflow continued somehow
      await activities.updateTemporalDepositActivity({
        workflow_id: workflowId,
        status: 'failed',
        error_message: failure.message,
      })
      console.error(`[${workflowId}] Successfully updated deposit status to 'failed'`) // Or use log() if it's informational
    } catch (dbError) {
      // Log the error during the failure update, but don't mask the original workflow error
      console.error(
        `[${workflowId}] CRITICAL: Failed to update deposit status to 'failed' after workflow error:`,
        dbError
      )
    }

    // Rethrow the original error to fail the workflow run
    throw failure
  }
}
