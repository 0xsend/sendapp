import type { PgBytea } from '@my/supabase/database.types'
import { bootstrap } from '@my/workflows/utils'
import { isRetryableDBError } from '@my/workflows/utils/isRetryableDBError'
import { ApplicationFailure, log } from '@temporalio/activity'
import { byteaToHex } from 'app/utils/byteaToHex'
import { decodeDepositUserOp } from 'app/utils/decodeDepositUserOp'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { UserOperation } from 'permissionless'
import superjson from 'superjson'
import {
  sendUserOperation,
  simulateUserOperation,
  waitForTransactionReceipt,
} from '../transfer-workflow/wagmi'
import {
  updateTemporalSendEarnDeposit,
  upsertTemporalSendEarnDeposit,
  type TemporalDeposit,
  type TemporalDepositInsert,
  type TemporalDepositUpdate,
} from './supabase'

type DepositActivities = {
  upsertTemporalDepositActivity: (params: TemporalDepositInsert) => Promise<TemporalDeposit>
  simulateDepositActivity: (workflowId: string, userOp: UserOperation<'v0.7'>) => Promise<void>
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

  const sendUserOpActivity = async (
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

  const waitForTransactionReceiptActivity = async (
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
  const upsertTemporalDepositActivity = async ({
    workflow_id: workflowId,
    owner,
    assets,
    vault,
  }: TemporalDepositInsert): Promise<TemporalDeposit> => {
    log.info('Upserting initial deposit record', {
      workflowId,
      owner: byteaToHex(owner as `\\x${string}`),
    })
    const { data: upsertData, error } = await upsertTemporalSendEarnDeposit({
      workflow_id: workflowId,
      status: 'initialized',
      owner,
      assets,
      vault,
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
  }

  const simulateDepositActivity = async (workflowId, userOp) => {
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
  }

  const decodeDepositUserOpActivity = async (workflowId, userOp) => {
    log.info('Decoding deposit UserOperation', { workflowId })
    try {
      const decoded = decodeDepositUserOp({ userOp })

      if (!decoded || !decoded.owner || !decoded.assets || !decoded.vault) {
        log.error('Failed to decode deposit user op or missing required fields', {
          workflowId,
          decoded,
        })
        throw new Error('User Operation is not a valid deposit or decoding failed')
      }

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
  }

  const updateTemporalDepositActivity = async ({
    workflow_id: workflowId,
    status,
    assets,
    vault,
    user_op_hash: userOpHash,
    tx_hash: txHash,
  }: TemporalDepositUpdate): Promise<TemporalDeposit> => {
    log.info('Updating temporal deposit record', {
      workflowId,
      status,
      user_op_hash: userOpHash,
      tx_hash: txHash,
    })
    const updatePayload: TemporalDepositUpdate = {
      workflow_id: workflowId,
      status: status,
      ...(assets && { assets }),
      ...(vault && { vault }),
      ...(userOpHash && { user_op_hash: userOpHash }),
      ...(txHash && { tx_hash: txHash }),
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
  }

  return {
    upsertTemporalDepositActivity,
    simulateDepositActivity,
    decodeDepositUserOpActivity,
    updateTemporalDepositActivity,
    sendUserOpActivity,
    waitForTransactionReceiptActivity,
  }
}
