import { ApplicationFailure, log, proxyActivities, workflowInfo } from '@temporalio/workflow'
import { byteaToHex } from 'app/utils/byteaToHex'
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
  try {
    // Get the latest block number
    const [blockNumber, depositCall] = await Promise.all([
      activities.getBaseBlockNumberActivity(),
      activities.decodeDepositUserOpActivity(workflowId, userOp),
    ] as const)

    log.debug(
      `Decoded UserOp: type=${depositCall.type}, owner=${depositCall.owner}, blockNumber=${blockNumber}`
    )

    // Initial Upsert - Pass the decoded deposit call to the activity
    log.debug('Initializing deposit record')
    await activities.upsertTemporalDepositActivity({
      workflow_id: workflowId,
      status: 'initialized',
      deposit: depositCall,
      block_num: blockNumber,
    })
    log.debug('Deposit record initialized')

    // Simulate the UserOperation
    log.debug('Simulating deposit UserOperation')
    await activities.simulateUserOperationActivity(userOp)
    log.debug('Simulation successful')

    // Update Status (Submitted)
    log.debug(`Updating deposit record to 'submitted'`)
    await activities.updateTemporalDepositActivity({
      workflow_id: workflowId,
      status: 'submitted',
    })
    log.debug(`Deposit record updated to 'submitted'`)

    // Send UserOp
    log.debug('Sending UserOperation')
    const userOpHashBytea = await activities.sendUserOpActivity(userOp)
    log.debug(`UserOperation sent, hash: ${userOpHashBytea}`)

    // Update Status (Sent)
    log.debug(`Updating deposit record to 'sent'`)
    await activities.updateTemporalDepositActivity({
      workflow_id: workflowId,
      status: 'sent',
      user_op_hash: userOpHashBytea, // Pass bytea hash
    })
    log.debug(`Deposit record updated to 'sent'`)

    // Wait for Receipt
    log.debug(`Waiting for transaction receipt for hash: ${userOpHashBytea}`)
    const { success: receiptSuccess, receipt } =
      await activities.waitForUserOperationReceiptActivity({
        hash: byteaToHex(userOpHashBytea),
        timeout: 60_000,
      })
    log.debug(
      `Transaction receipt received: txHash=${receipt.transactionHash}, block=${receipt.blockNumber}`
    )

    if (!receiptSuccess) {
      throw ApplicationFailure.nonRetryable(`Transaction failed: ${receipt.transactionHash}`)
    }

    // Verify Indexing
    log.debug(`Verifying deposit indexing for tx: ${receipt.transactionHash}`)
    await activities.verifyDepositIndexedActivity({
      transactionHash: receipt.transactionHash,
      owner: depositCall.owner, // Use owner from decoded call
    })
    log.debug('Deposit indexing verified')

    try {
      // Pass the deposit call and tx hash; activity determines if upsert is needed
      await activities.upsertReferralRelationshipActivity({
        deposit: depositCall,
        transactionHash: receipt.transactionHash,
      })
    } catch (referralError) {
      // Log the error but allow the workflow to continue
      log.warn(
        // Use warn for actual warnings
        `Non-fatal error during referral upsert activity: ${referralError.message}`,
        referralError
      )
    }
    log.debug('Workflow completed successfully')

    return userOpHashBytea
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
      log.error(`Attempting to update deposit status to 'failed' in DB`)
      await activities.updateTemporalDepositActivity({
        workflow_id: workflowId,
        status: 'failed',
        error_message: failure.message, // Use message from ApplicationFailure
      })
      log.error(`Successfully updated deposit status to 'failed'`)
    } catch (dbError) {
      // Log the error during the failure update, but don't mask the original workflow error
      log.error(
        // Reverted to log.error
        `CRITICAL: Failed to update deposit status to 'failed' after workflow error:`,
        dbError
      )
    }

    // Rethrow the original error to fail the workflow run
    throw failure
  }
}
