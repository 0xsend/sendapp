import { proxyActivities, workflowInfo, ApplicationFailure } from '@temporalio/workflow'
import type { createDepositActivities } from './activities'
import type { TemporalDepositInsert } from './supabase' // Added import
import type { UserOperation } from 'permissionless'
import { hexToBytea } from 'app/utils/hexToBytea'
import debug from 'debug'

const log = debug('workflows:deposit')

// Proxy the activities with a default timeout
const activities = proxyActivities<ReturnType<typeof createDepositActivities>>({
  startToCloseTimeout: '10 minutes', // Same as transfer workflow
})

export async function DepositWorkflow(userOp: UserOperation<'v0.7'>) {
  const { workflowId } = workflowInfo()
  log(`Starting SendEarn Deposit Workflow: ${workflowId}`)

  // Initial owner is needed for the first upsert and activity trigger
  const initialOwnerBytea = hexToBytea(userOp.sender)

  try {
    // 1. Initialize record in the database
    log(`[${workflowId}] Initializing deposit record`)
    // Cast to satisfy the Insert type, assuming DB handles nulls/defaults for other required fields
    await activities.upsertTemporalDepositActivity(
      {
        workflow_id: workflowId,
        status: 'initialized', // Explicitly set initial status
        owner: initialOwnerBytea,
      } as Pick<TemporalDepositInsert, 'workflow_id' | 'status' | 'owner'> as TemporalDepositInsert // Use Pick and cast
    )
    log(`[${workflowId}] Deposit record initialized`)

    // 2. Simulate the UserOperation
    log(`[${workflowId}] Simulating deposit UserOperation`)
    await activities.simulateDepositActivity(workflowId, userOp)
    log(`[${workflowId}] Simulation successful`)

    // 4. Decode the UserOperation to get deposit details
    log(`[${workflowId}] Decoding deposit UserOperation`)
    const { owner, assets, vault } = await activities.decodeDepositUserOpActivity(
      workflowId,
      userOp
    )
    log(`[${workflowId}] Decoded deposit: owner=${userOp.sender}, assets=${assets}, vault=${vault}`)

    // 5. Update record with decoded data and 'submitted' status
    log(`[${workflowId}] Updating deposit record to 'submitted'`)
    await activities.updateTemporalDepositActivity({
      workflow_id: workflowId, // Use snake_case to match DB schema type
      status: 'submitted',
      owner, // Should match initialOwnerBytea, but use decoded for consistency
      assets,
      vault,
    })
    log(`[${workflowId}] Deposit record updated to 'submitted'`)

    // 6. Send the UserOperation
    log(`[${workflowId}] Sending UserOperation`)
    const userOpHash = await activities.sendUserOpActivity(workflowId, userOp)
    log(`[${workflowId}] UserOperation sent, hash: ${userOpHash}`)

    // 7. Update record with UserOperation hash and 'sent' status
    log(`[${workflowId}] Updating deposit record to 'sent'`)
    await activities.updateTemporalDepositActivity({
      workflow_id: workflowId, // Use snake_case to match DB schema type
      status: 'sent',
      user_op_hash: userOpHash, // Use snake_case
    })
    log(`[${workflowId}] Deposit record updated to 'sent'`)

    // 8. Wait for the transaction receipt
    log(`[${workflowId}] Waiting for transaction receipt for hash: ${userOpHash}`)
    const receipt = await activities.waitForTransactionReceiptActivity(workflowId, userOpHash)
    log(
      `[${workflowId}] Transaction receipt received: txHash=${receipt.transactionHash}, block=${receipt.blockNumber}`
    )

    // 9. Update record with transaction hash, block number, and 'confirmed' status
    log(`[${workflowId}] Updating deposit record to 'confirmed'`)
    await activities.updateTemporalDepositActivity({
      workflow_id: workflowId, // Use snake_case to match DB schema type
      status: 'confirmed',
      tx_hash: hexToBytea(receipt.transactionHash), // Use snake_case
      // block_num: receipt.blockNumber, // Pass bigint directly if DB column is numeric/bigint
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
      await activities.updateTemporalDepositActivity({
        workflow_id: workflowId, // Use snake_case to match DB schema type
        status: 'failed',
        owner: initialOwnerBytea, // Include owner if possible, helps debugging
        error_message: failure.message, // Corrected property name
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
