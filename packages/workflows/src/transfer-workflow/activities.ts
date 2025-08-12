import { bootstrap, isRetryableDBError } from '@my/workflows/utils'
import { ApplicationFailure, log } from '@temporalio/activity'
import { allCoins } from 'app/data/coins'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import type { GetUserOperationReceiptReturnType, UserOperation } from 'permissionless'
import type { Address } from 'viem'
import {
  updateTemporalSendAccountTransfer,
  upsertTemporalSendAccountTransfer,
  type TemporalTransfer,
  type TemporalTransferInsert,
  type TemporalTransferUpdate,
} from './supabase'
import { isAddressInTopic, isReceiveTopic, isTransferTopic } from './wagmi'

type TransferActivities = {
  upsertTemporalSendAccountTransferActivity: (
    params: TemporalTransferInsert
  ) => Promise<TemporalTransfer>
  decodeTransferUserOpActivity: (
    workflowId: string,
    userOp: UserOperation<'v0.7'>
  ) => Promise<{
    from: Address
    to: Address
    amount: bigint
    token: Address | null
  }>
  updateTemporalSendAccountTransferActivity: (
    params: TemporalTransferUpdate
  ) => Promise<TemporalTransfer>
  cleanupTemporalActivityAfterConfirmation: (params: {
    workflow_id: string
    final_event_id: string
    final_event_name: string
  }) => Promise<void>
  getEventFromTransferActivity: ({
    bundlerReceipt,
    token,
    from,
    to,
  }: {
    bundlerReceipt: GetUserOperationReceiptReturnType
    token: Address | null
    from: Address
    to: Address
  }) => Promise<{
    eventName: string
    eventId: string
  }>
}

export const createTransferActivities = (
  env: Record<string, string | undefined>
): TransferActivities => {
  bootstrap(env)

  return {
    async upsertTemporalSendAccountTransferActivity(params) {
      const { workflow_id } = params
      const { data: upsertData, error } = await upsertTemporalSendAccountTransfer({
        ...params,
        status: 'initialized',
      })

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
            workflow_id,
          })
        }

        const { error: upsertFailedError } = await upsertTemporalSendAccountTransfer({
          workflow_id,
          status: 'failed',
        })
        if (upsertFailedError) {
          throw ApplicationFailure.retryable(
            'Error upserting failed transfer from temporal.send_account_transfers',
            upsertFailedError.code,
            {
              error: upsertFailedError,
              workflow_id,
            }
          )
        }
        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
          workflow_id,
        })
      }

      return upsertData
    },
    async decodeTransferUserOpActivity(workflowId, userOp) {
      try {
        const { from, to, token, amount } = decodeTransferUserOp({ userOp })
        if (!from || !to || !amount || !token) {
          log.error('Failed to decode transfer user op', { from, to, amount, token })
          throw new Error('User Operation is not a valid transfer')
        }
        if (!allCoins.find((c) => c.token === token)) {
          log.error('Token ${token} is not a supported', { token })
          throw new Error(`Token ${token} is not a supported`)
        }
        if (amount < 0n) {
          log.error('User Operation has amount < 0', { amount })
          throw new Error('User Operation has amount < 0')
        }
        if (!userOp.signature) {
          log.error('UserOp signature is required')
          throw new Error('UserOp signature is required')
        }

        return { from, to, amount, token: token === 'eth' ? null : token }
      } catch (error) {
        log.error('decodeTransferUserOpActivity failed', { error })
        const { error: updateError } = await updateTemporalSendAccountTransfer({
          workflow_id: workflowId,
          status: 'failed',
        })
        if (updateError) {
          throw ApplicationFailure.retryable(
            'Error updating transfer status to failed from temporal.send_account_transfers',
            updateError.code,
            {
              error: updateError,
              workflowId,
            }
          )
        }
        log.error('Error decoding user operation:', {
          code: error.code,
          name: error.name,
          message: error.message,
        })
        throw ApplicationFailure.nonRetryable(
          'Error decoding user operation',
          error.code,
          error.name,
          error.message
        )
      }
    },
    async updateTemporalSendAccountTransferActivity(params) {
      const { workflow_id } = params
      const { data: upsertedData, error } = await updateTemporalSendAccountTransfer(params)

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
            workflow_id,
          })
        }

        const { error: updateError } = await updateTemporalSendAccountTransfer({
          workflow_id,
          status: 'failed',
        })
        if (updateError) {
          throw ApplicationFailure.retryable(
            'Error updating transfer status to failed from temporal.send_account_transfers',
            updateError.code,
            {
              error: updateError,
              workflow_id,
            }
          )
        }

        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
          workflow_id,
        })
      }

      return upsertedData
    },
    async cleanupTemporalActivityAfterConfirmation({
      workflow_id,
      final_event_id,
      final_event_name,
    }) {
      // Enhanced defensive checks for audit compliance
      if (!workflow_id || !final_event_id || !final_event_name) {
        log.warn('Invalid parameters for cleanup activity', {
          workflow_id,
          final_event_id,
          final_event_name,
        })
        return
      }

      // Validate workflow_id format to prevent SQL injection and ensure compliance
      const workflowIdPattern = /^temporal\/transfer\/[\w-]+\/0x[a-fA-F0-9]{64}$/
      if (!workflowIdPattern.test(workflow_id)) {
        log.warn('Invalid workflow_id format, skipping cleanup for security', {
          workflow_id,
        })
        return
      }

      // Import createSupabaseAdminClient here to match pattern from supabase.ts
      const { createSupabaseAdminClient } = await import('app/utils/supabase/admin')

      const supabaseAdmin = createSupabaseAdminClient()

      // Enhanced verification with additional safety checks
      // This ensures we only cleanup after the blockchain record is confirmed
      const { data: finalActivity, error: verifyError } = await supabaseAdmin
        .from('activity')
        .select('id, created_at')
        .eq('event_name', final_event_name)
        .eq('event_id', final_event_id)
        .single()

      if (verifyError && verifyError.code !== 'PGRST116') {
        // PGRST116 = not found
        if (isRetryableDBError(verifyError)) {
          throw ApplicationFailure.retryable(
            'Database connection error during cleanup verification, retrying...',
            verifyError.code,
            {
              error: verifyError,
              workflow_id,
              final_event_id,
              final_event_name,
            }
          )
        }
        log.warn('Failed to verify final activity exists before cleanup', {
          error: verifyError,
          workflow_id,
          final_event_id,
          final_event_name,
        })
        // Continue with cleanup even if verification fails - the temporal trigger will handle it
      } else if (!finalActivity) {
        log.warn('Final blockchain activity not found, skipping temporal cleanup', {
          workflow_id,
          final_event_id,
          final_event_name,
        })
        // Don't cleanup if final record doesn't exist - let the temporal trigger handle it
        return
      }

      // Additional timing safety check - ensure some time has passed for proper sequencing
      if (finalActivity?.created_at) {
        const createdAt = new Date(finalActivity.created_at)
        const now = new Date()
        const timeDiff = now.getTime() - createdAt.getTime()
        const minDelayMs = 1000 // 1 second minimum delay

        if (timeDiff < minDelayMs) {
          log.info('Delaying cleanup to ensure proper sequencing', {
            workflow_id,
            time_diff_ms: timeDiff,
            min_delay_ms: minDelayMs,
          })
          // Brief delay to ensure proper timing
          await new Promise((resolve) => setTimeout(resolve, minDelayMs - timeDiff))
        }
      }

      // Check if temporal activity still exists before attempting cleanup
      const { data: temporalActivity, error: checkError } = await supabaseAdmin
        .from('activity')
        .select('id')
        .eq('event_name', 'temporal_send_account_transfers')
        .eq('event_id', workflow_id)
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        log.info('Temporal activity already cleaned up', {
          workflow_id,
        })
        return
      }

      if (checkError) {
        if (isRetryableDBError(checkError)) {
          throw ApplicationFailure.retryable(
            'Database connection error during temporal activity check, retrying...',
            checkError.code,
            {
              error: checkError,
              workflow_id,
            }
          )
        }
        log.warn('Failed to check temporal activity existence', {
          error: checkError,
          workflow_id,
        })
        // Continue with cleanup attempt
      }

      // Proceed with cleanup since final blockchain activity exists
      const { error } = await supabaseAdmin
        .from('activity')
        .delete()
        .eq('event_name', 'temporal_send_account_transfers')
        .eq('event_id', workflow_id)

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable(
            'Database connection error during cleanup, retrying...',
            error.code,
            {
              error,
              workflow_id,
            }
          )
        }

        log.warn('Failed to cleanup temporal activity (non-critical)', {
          error,
          workflow_id,
        })
        // Don't throw - cleanup failure should not fail the entire workflow
        // since the temporal entry will eventually be cleaned up by other means
      } else {
        log.info('Successfully cleaned up temporal activity', {
          workflow_id,
          final_event_id,
          final_event_name,
        })
      }
    },
    async getEventFromTransferActivity({ bundlerReceipt, token, from, to }) {
      const logs = bundlerReceipt.logs
      const block_num = bundlerReceipt.receipt.blockNumber.toString()
      const tx_idx = bundlerReceipt.receipt.transactionIndex.toString()

      const log_idx = token
        ? logs
            .find(
              ({ topics }) =>
                topics[0] &&
                topics[1] &&
                topics[2] &&
                isTransferTopic(topics[0]) &&
                isAddressInTopic(topics[1], from) &&
                isAddressInTopic(topics[2], to)
            )
            ?.logIndex.toString()
        : logs
            .find(
              ({ topics, address }) =>
                address.toLowerCase() === to.toLowerCase() &&
                topics[0] &&
                topics[1] &&
                isReceiveTopic(topics[0]) &&
                isAddressInTopic(topics[1], from)
            )
            ?.logIndex.toString()

      const eventName = token ? 'send_account_transfers' : 'send_account_receives'
      const eventId = `${eventName}/base_logs/${block_num}/${tx_idx}/${log_idx}`

      return {
        eventName,
        eventId,
      }
    },
  }
}
