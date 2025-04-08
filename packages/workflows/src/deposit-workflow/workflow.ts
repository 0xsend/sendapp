import { ApplicationFailure, proxyActivities, workflowInfo, log } from '@temporalio/workflow'
// import { isFactoryDeposit, isVaultDeposit } from 'app/utils/decodeSendEarnDepositUserOp'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { UserOperation } from 'permissionless'
// import { isAddressEqual, zeroAddress } from 'viem'
import type { createDepositActivities } from './activities'

const activities = proxyActivities<ReturnType<typeof createDepositActivities>>({
  startToCloseTimeout: '10 minutes', // Increased timeout for potentially longer indexing/referral steps
})

interface DepositWorkflowInput {
  userOp: UserOperation<'v0.7'>
}

/**
 * The Send Earn Deposit workflow handles validating and submitting the users
 * deposit operation to the bundler, waiting for the indexing of the onchain events
 * and then ensuring a referral relationship is created if needed
 * (due to race conditions between the shovel tables).
 *
 * The workflow also shows updates to user by using a temporal table that
 * mimics the schema of the `public.send_earn_deposit` table.
 */
export async function DepositWorkflow({ userOp }: DepositWorkflowInput) {
  const { workflowId } = workflowInfo()
  log.debug(`Starting SendEarn Deposit Workflow: ${workflowId}`)

  log.debug(`[${workflowId}] Starting SendEarn Deposit Workflow`)

  try {
    // Decode UserOp (Moved inside try block)
    const depositCall = await activities.decodeDepositUserOpActivity(workflowId, userOp)
    log.debug(
      `[${workflowId}] Decoded UserOp: type=${depositCall.type}, owner=${depositCall.owner}`
    )

    // Initial Upsert
    log.debug(`[${workflowId}] Initializing deposit record`)
    await activities.upsertTemporalDepositActivity({
      workflow_id: workflowId,
      status: 'initialized',
      owner: hexToBytea(depositCall.owner), // Convert owner to bytea
      assets: depositCall.assets.toString(), // Convert assets (bigint) to string
      // Set vault based on deposit type, convert to bytea if present
      // vault: isVaultDeposit(depositCall) ? hexToBytea(depositCall.vault) : null,
      vault: null,
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

    // Conditional Referral Upsert
    // Use literal zero address string instead of imported constant
    // if (isFactoryDeposit(depositCall) && !isAddressEqual(depositCall.referrer, zeroAddress)) {
    //   log.debug(
    //     `[${workflowId}] Factory deposit with referrer (${depositCall.referrer}), attempting referral upsert`
    //   )
    //   try {
    //     await activities.upsertReferralRelationshipActivity({
    //       referrerAddress: depositCall.referrer,
    //       referredAddress: depositCall.owner,
    //       transactionHash: receipt.transactionHash,
    //     })
    //     log.debug(`[${workflowId}] Referral upsert activity completed (may have been skipped or ignored)`)
    //   } catch (referralError) {
    //     // Log the error but allow the workflow to continue, as per plan
    //     // Use log.debug() with a WARN prefix instead of log.warn()
    //     log.debug(
    //       `WARN: [${workflowId}] Non-fatal error during referral upsert activity: ${referralError.message}`,
    //       referralError
    //     )
    //   }
    // } else {
    //   log.debug(`[${workflowId}] Skipping referral upsert (not a factory deposit or no referrer)`)
    // }

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
      console.error(`[${workflowId}] Attempting to update deposit status to 'failed' in DB`) // Reverted to console.error
      await activities.updateTemporalDepositActivity({
        workflow_id: workflowId,
        status: 'failed',
        error_message: failure.message, // Use message from ApplicationFailure
      })
      console.error(`[${workflowId}] Successfully updated deposit status to 'failed'`) // Reverted to console.error
    } catch (dbError) {
      // Log the error during the failure update, but don't mask the original workflow error
      console.error(
        // Reverted to console.error
        `[${workflowId}] CRITICAL: Failed to update deposit status to 'failed' after workflow error:`,
        dbError
      )
    }

    // Rethrow the original error to fail the workflow run
    throw failure
  }
}
