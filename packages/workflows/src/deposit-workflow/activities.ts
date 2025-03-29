import type { PgBytea } from '@my/supabase/database.types'
import { bootstrap } from '@my/workflows/utils'
import { ApplicationFailure, log } from '@temporalio/activity'
import { byteaToHex } from 'app/utils/byteaToHex'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { UserOperation } from 'permissionless'
import superjson from 'superjson'
import {
  getBaseBlockNumber,
  sendUserOperation,
  simulateUserOperation,
  waitForTransactionReceipt,
} from '../transfer-workflow/wagmi'
import {
  isRetryableDBError,
  updateTemporalSendEarnDeposit,
  upsertTemporalSendEarnDeposit,
  type TemporalDeposit,
  type TemporalDepositInsert,
  type TemporalDepositUpdate,
} from './supabase'
import { decodeDepositUserOp } from 'app/utils/decodeDepositUserOp'

type DepositActivities = {
  upsertTemporalDepositActivity: (params: TemporalDepositInsert) => Promise<TemporalDeposit>
  simulateDepositActivity: (workflowId: string, userOp: UserOperation<'v0.7'>) => Promise<void>
  getBaseBlockNumberActivity: () => Promise<bigint>
  decodeDepositUserOpActivity: (
    workflowId: string,
    userOp: UserOperation<'v0.7'>
  ) => Promise<{
    owner: PgBytea
    assets: bigint
    vault: PgBytea
  }>
  updateTemporalDepositActivity: (params: TemporalDepositUpdate) => Promise<TemporalDeposit>
  sendUserOpActivity: (workflowId: string, userOp: UserOperation<'v0.7'>) => Promise<PgBytea> // Returns userOpHash as PgBytea
  waitForTransactionReceiptActivity: (
    workflowId: string,
    userOpHash: PgBytea
  ) => Promise<{
    transactionHash: `0x${string}`
    blockNumber: bigint
  }>
}

export const createDepositActivities = (
  env: Record<string, string | undefined>
): DepositActivities => {
  bootstrap(env)

  // --- Reusable Activities (Copied/Adapted from Transfer Workflow for clarity) ---
  // These might be refactored into a shared module in a real implementation

  const reusableSendUserOpActivity = async (
    workflowId: string,
    userOp: UserOperation<'v0.7'>
  ): Promise<PgBytea> => {
    try {
      const hash = await sendUserOperation(userOp)
      const hashBytea = hexToBytea(hash)
      return hashBytea
    } catch (error) {
      log.error('sendUserOpActivity failed', { workflowId, error })
      const { error: updateError } = await updateTemporalSendEarnDeposit({
        workflow_id: workflowId,
        status: 'failed',
        error_message: error.message ?? 'Failed to send UserOperation',
      })
      if (updateError) {
        // Log the update error but prioritize throwing the original failure
        log.error('Failed to update deposit status after sendUserOp failure', {
          workflowId,
          updateError,
        })
      }
      // Throw non-retryable failure for the activity
      throw ApplicationFailure.nonRetryable(
        error.message ?? 'Error sending user operation',
        error.code ?? 'SEND_USER_OP_FAILED',
        error
      )
    }
  }

  const reusableWaitForTransactionReceiptActivity = async (
    workflowId: string,
    userOpHash: PgBytea
  ): Promise<{ transactionHash: `0x${string}`; blockNumber: bigint }> => {
    const hexHash = byteaToHex(userOpHash)
    try {
      const bundlerReceipt = await waitForTransactionReceipt(hexHash)
      if (!bundlerReceipt) {
        throw ApplicationFailure.retryable(
          'No receipt returned from waitForTransactionReceipt',
          'NO_RECEIPT'
        )
      }
      log.info('waitForTransactionReceiptActivity received receipt', {
        workflowId,
        bundlerReceipt: superjson.stringify(bundlerReceipt),
      })
      if (!bundlerReceipt.success) {
        // Non-retryable failure if the transaction itself failed on-chain
        throw ApplicationFailure.nonRetryable('Transaction failed on-chain', 'TX_FAILED', {
          receipt: bundlerReceipt.receipt,
        })
      }
      if (!bundlerReceipt.receipt.transactionHash || !bundlerReceipt.receipt.blockNumber) {
        throw ApplicationFailure.nonRetryable(
          'Receipt missing transactionHash or blockNumber',
          'INVALID_RECEIPT',
          { receipt: bundlerReceipt.receipt }
        )
      }
      return {
        transactionHash: bundlerReceipt.receipt.transactionHash,
        blockNumber: bundlerReceipt.receipt.blockNumber,
      }
    } catch (error) {
      log.error('waitForTransactionReceiptActivity failed', { workflowId, hexHash, error })
      // Attempt to mark the workflow as failed in the DB
      const { error: updateError } = await updateTemporalSendEarnDeposit({
        workflow_id: workflowId,
        status: 'failed',
        error_message: error.message ?? 'Failed waiting for transaction receipt',
      })
      if (updateError) {
        log.error('Failed to update deposit status after waitForTransactionReceipt failure', {
          workflowId,
          updateError,
        })
      }

      // Re-throw original error (could be retryable or non-retryable based on the catch block)
      if (error instanceof ApplicationFailure) {
        throw error // Preserve original failure type
      }
      // Treat unexpected errors as non-retryable by default
      throw ApplicationFailure.nonRetryable(
        error.message ?? 'Error waiting for transaction receipt',
        error.code ?? 'WAIT_RECEIPT_FAILED',
        error
      )
    }
  }
  // Removed misplaced brace

  const reusableGetBaseBlockNumberActivity = async (): Promise<bigint> => {
    try {
      return await getBaseBlockNumber()
    } catch (error) {
      log.error('Failed to get block number', { code: error?.code, error })
      // Getting block number is usually transient
      throw ApplicationFailure.retryable(
        'Failed to get block number',
        error?.code ?? 'GET_BLOCK_FAILED',
        error
      )
    }
  } // Added brace here

  // --- Deposit Specific Activities ---

  return {
    async upsertTemporalDepositActivity({ workflow_id: workflowId, owner }) {
      log.info('Upserting initial deposit record', {
        workflowId,
        owner: byteaToHex(owner as `\\x${string}`),
      })
      const { data: upsertData, error } = await upsertTemporalSendEarnDeposit({
        workflow_id: workflowId,
        status: 'initialized',
        owner: owner,
        // Other fields like asset, vault, amount will be added in update step
      })

      if (error) {
        log.error('upsertTemporalDepositActivity failed', { workflowId, error })
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable(
            'Database connection error, retrying upsert...',
            error.code,
            { error, workflowId }
          )
        }
        // Don't try to update status to failed if the initial insert failed
        throw ApplicationFailure.nonRetryable(
          'Database error occurred during initial upsert',
          error.code,
          { error, workflowId }
        )
      }
      log.info('Initial deposit record upserted', { workflowId, id: upsertData.workflow_id }) // Corrected property access
      return upsertData
    },

    async simulateDepositActivity(workflowId, userOp) {
      log.info('Simulating deposit UserOperation', { workflowId })
      try {
        await simulateUserOperation(userOp)
        log.info('Deposit UserOperation simulation successful', { workflowId })
      } catch (error) {
        log.error('simulateDepositActivity failed', { workflowId, error })
        const { error: updateError } = await updateTemporalSendEarnDeposit({
          workflow_id: workflowId,
          status: 'failed',
          error_message: error.message ?? 'Simulation failed',
        })
        if (updateError) {
          log.error('Failed to update deposit status after simulation failure', {
            workflowId,
            updateError,
          })
        }
        throw ApplicationFailure.nonRetryable(
          error.message ?? 'Error simulating user operation',
          error.code ?? 'SIMULATION_FAILED',
          error
        )
      }
    },

    getBaseBlockNumberActivity: reusableGetBaseBlockNumberActivity,

    async decodeDepositUserOpActivity(workflowId, userOp) {
      log.info('Decoding deposit UserOperation', { workflowId })
      try {
        // --- Placeholder for actual decoding logic ---
        // This function needs to parse userOp.callData using the Send Earn contract ABI
        // It should return { owner: `0x...`, assets: bigint, vault: `0x...` }
        const decoded = decodeDepositUserOp({ userOp }) // Replace with actual call

        if (!decoded || !decoded.owner || !decoded.assets || !decoded.vault) {
          log.error('Failed to decode deposit user op or missing required fields', {
            workflowId,
            decoded,
          })
          throw new Error('User Operation is not a valid deposit or decoding failed')
        }
        // Add any other necessary validations (e.g., check if asset/vault are known addresses)

        log.info('Deposit UserOperation decoded successfully', {
          workflowId,
          owner: decoded.owner,
          assets: decoded.assets,
          vault: decoded.vault,
        })

        return {
          owner: hexToBytea(decoded.owner),
          assets: decoded.assets,
          vault: hexToBytea(decoded.vault),
        }
      } catch (error) {
        log.error('decodeDepositUserOpActivity failed', { workflowId, error })
        const { error: updateError } = await updateTemporalSendEarnDeposit({
          workflow_id: workflowId,
          status: 'failed',
          error_message: error.message ?? 'Failed to decode UserOperation',
        })
        if (updateError) {
          log.error('Failed to update deposit status after decode failure', {
            workflowId,
            updateError,
          })
        }
        throw ApplicationFailure.nonRetryable(
          error.message ?? 'Error decoding user operation',
          error.code ?? 'DECODE_FAILED',
          error
        )
      }
    },

    async updateTemporalDepositActivity({
      workflow_id: workflowId,
      status,
      assets,
      vault,
      user_op_hash: userOpHash,
      tx_hash: txHash,
    }) {
      log.info('Updating temporal deposit record', {
        workflowId,
        status,
        user_op_hash: userOpHash,
        tx_hash: txHash,
      })
      const updatePayload: TemporalDepositUpdate = {
        workflow_id: workflowId, // Ensure snake_case for DB operations
        status: status,
        ...(assets && { assets }), // asset is already bigint
        ...(vault && { vault }), // vault is already PgBytea
        ...(userOpHash && { user_op_hash: userOpHash }), // user_op_hash is PgBytea
        ...(txHash && { tx_hash: txHash }), // tx_hash is PgBytea
      }

      const { data: updatedData, error } = await updateTemporalSendEarnDeposit(updatePayload)

      if (error) {
        log.error('updateTemporalDepositActivity failed', { workflowId, status, error })
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable(
            'Database connection error, retrying update...',
            error.code,
            { error, workflowId, status }
          )
        }
        // Avoid trying to update status to 'failed' if the update itself failed,
        // unless the current status isn't already 'failed'.
        if (status !== 'failed') {
          const { error: updateFailedError } = await updateTemporalSendEarnDeposit({
            workflow_id: workflowId,
            status: 'failed',
            error_message: `DB error during status update to ${status}: ${error.message}`,
          })
          if (updateFailedError) {
            log.error('Failed to update deposit status to failed after another update failure', {
              workflowId,
              updateFailedError,
            })
          }
        }
        throw ApplicationFailure.nonRetryable(
          `Database error occurred during update to status ${status}`,
          error.code,
          { error, workflowId, status }
        )
      }
      log.info('Temporal deposit record updated successfully', {
        workflowId,
        status: updatedData.status,
      })
      return updatedData
    },

    // Use the reusable implementations
    sendUserOpActivity: reusableSendUserOpActivity,
    waitForTransactionReceiptActivity: reusableWaitForTransactionReceiptActivity,
  }
}
