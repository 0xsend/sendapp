import { ApplicationFailure, log, proxyActivities, workflowInfo } from '@temporalio/workflow'
import type { UserOperation } from 'permissionless'
import type { createDepositActivities } from './activities'

const activities = proxyActivities<ReturnType<typeof createDepositActivities>>({
  startToCloseTimeout: '10 minutes', // Increased timeout for potentially longer indexing/referral steps
})

interface DepositWorkflowInput {
  userOp: UserOperation<'v0.7'>
}

/**
 * The Send Earn Deposit workflow handles validating and submitting the users
 * deposit operation to the bundler, waiting for the indexing of the onchain events,
 * and then attempting to create a referral relationship if the deposit was via the factory
 * with a non-zero referrer (logic handled within the `upsertReferralRelationshipActivity`).
 *
 * The workflow updates a temporal table (`temporal.send_earn_deposits`) to track progress,
 * which mimics the schema of the `public.send_earn_deposit` table.
 */
export async function DepositWorkflow({ userOp }: DepositWorkflowInput) {
  const { workflowId } = workflowInfo()
  log.debug(`Starting SendEarn Deposit Workflow: ${workflowId}`)

  log.debug(`[${workflowId}] Starting SendEarn Deposit Workflow`)

  try {
    // Get the latest block number
    const [blockNumber, depositCall] = await Promise.all([
      activities.getBlockNumberActivity(),
      activities.decodeDepositUserOpActivity(workflowId, userOp),
    ] as const)

    // Decode UserOp (Moved inside try block)
    log.debug(
      `[${workflowId}] Decoded UserOp: type=${depositCall.type}, owner=${depositCall.owner}, blockNumber=${blockNumber}`
    )

    // Initial Upsert - Pass the decoded deposit call to the activity
    log.debug(`[${workflowId}] Initializing deposit record`)
    await activities.upsertTemporalDepositActivity({
      workflow_id: workflowId,
      status: 'initialized',
      deposit: depositCall,
      block_num: blockNumber,
    })
    log.debug(`[${workflowId}] Deposit record initialized`)

    // Simulate the UserOperation
    log.debug(`[${workflowId}] Simulating deposit UserOperation`)
    await activities.simulateDepositActivity(workflowId, userOp)
    log.debug(`[${workflowId}] Simulation successful`)

    // Update Status (Submitted)
    log.debug(`[${workflowId}] Updating deposit record to 'submitted'`)
    await activities.updateTemporalDepositActivity({
      workflow_id: workflowId,
      status: 'submitted',
    })
    log.debug(`[${workflowId}] Deposit record updated to 'submitted'`)

    // Send UserOp
    log.debug(`[${workflowId}] Sending UserOperation`)
    const userOpHashBytea = await activities.sendUserOpActivity(workflowId, userOp)
    log.debug(`[${workflowId}] UserOperation sent, hash: ${userOpHashBytea}`)

    // Update Status (Sent)
    log.debug(`[${workflowId}] Updating deposit record to 'sent'`)
    await activities.updateTemporalDepositActivity({
      workflow_id: workflowId,
      status: 'sent',
      user_op_hash: userOpHashBytea, // Pass bytea hash
    })
    log.debug(`[${workflowId}] Deposit record updated to 'sent'`)

    // Wait for Receipt
    log.debug(`[${workflowId}] Waiting for transaction receipt for hash: ${userOpHashBytea}`)
    const receipt = await activities.waitForTransactionReceiptActivity(workflowId, userOpHashBytea)
    log.debug(
      `[${workflowId}] Transaction receipt received: txHash=${receipt.transactionHash}, block=${receipt.blockNumber}`
    )

    // Verify Indexing
    log.debug(`[${workflowId}] Verifying deposit indexing for tx: ${receipt.transactionHash}`)
    await activities.verifyDepositIndexedActivity({
      transactionHash: receipt.transactionHash,
      owner: depositCall.owner, // Use owner from decoded call
    })
    log.debug(`[${workflowId}] Deposit indexing verified`)

    // Attempt Referral Upsert - Activity handles the conditional logic internally
    log.debug(`[${workflowId}] Attempting referral upsert (activity checks conditions)`)
    try {
      // Pass the deposit call and tx hash; activity determines if upsert is needed
      await activities.upsertReferralRelationshipActivity({
        deposit: depositCall,
        transactionHash: receipt.transactionHash,
      })
      log.debug(
        `[${workflowId}] Referral upsert activity completed (may have been skipped or ignored)`
      )
    } catch (referralError) {
      // Log the error but allow the workflow to continue
      log.warn(
        // Use warn for actual warnings
        `[${workflowId}] Non-fatal error during referral upsert activity: ${referralError.message}`,
        referralError
      )
    }

    // Workflow Completion (Implicit)
    // No final status update needed, DB trigger handles cleanup.
    log.debug(`[${workflowId}] Workflow completed successfully`)

    return userOpHashBytea // Return the userOpHash (bytea) on success
  } catch (error) {
    console.error(`[${workflowId}] Workflow failed:`, error) // Reverted to console.error

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
      log.error(`[${workflowId}] Attempting to update deposit status to 'failed' in DB`)
      await activities.updateTemporalDepositActivity({
        workflow_id: workflowId,
        status: 'failed',
        error_message: failure.message, // Use message from ApplicationFailure
      })
      log.error(`[${workflowId}] Successfully updated deposit status to 'failed'`)
    } catch (dbError) {
      // Log the error during the failure update, but don't mask the original workflow error
      log.error(
        // Reverted to log.error
        `[${workflowId}] CRITICAL: Failed to update deposit status to 'failed' after workflow error:`,
        dbError
      )
    }

    // Rethrow the original error to fail the workflow run
    throw failure
  }
}
