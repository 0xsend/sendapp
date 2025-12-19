import { bootstrap, isRetryableDBError } from '@my/workflows/utils'
import { Context as ActivityContext, ApplicationFailure, log, sleep } from '@temporalio/activity'
import { allCoins } from 'app/data/coins'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
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
  verifyTransferIndexedActivity: (params: { eventId: string }) => Promise<boolean>
}

export const createTransferActivities = (
  env: Record<string, string | undefined>
): TransferActivities => {
  bootstrap(env)

  return {
    async verifyTransferIndexedActivity({ eventId }) {
      const maxAttempts = 10
      const initialDelayMs = 1000
      const backoffCoefficient = 2

      log.info('Starting verification for indexed transfer', { eventId })

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        ActivityContext.current().heartbeat(`Attempt ${attempt}/${maxAttempts}`) // Send heartbeat

        try {
          const supabaseAdmin = createSupabaseAdminClient()
          const { error, count } = await supabaseAdmin
            .from('send_account_transfers')
            .select('*', { count: 'exact', head: true }) // Efficiently check existence
            .eq('event_id', eventId)

          if (error) {
            log.error('DB error checking send_account_transfers', { eventId, attempt, error })
            if (isRetryableDBError(error)) {
              // Let Temporal handle retry based on policy for retryable DB errors
              throw ApplicationFailure.retryable(
                `Retryable DB error on attempt ${attempt}`,
                error.code,
                { error }
              )
            }
            // Non-retryable DB error
            throw ApplicationFailure.nonRetryable(
              'Non-retryable DB error checking transfer index',
              error.code,
              { error }
            )
          }

          if (count !== null && count > 0) {
            log.info('Transfer successfully verified as indexed', { eventId, attempt })
            return true // Found the record
          }

          // Record not found yet, log and prepare for next attempt
          log.info(`Transfer not yet indexed, attempt ${attempt}/${maxAttempts}`, { eventId })
        } catch (error) {
          // Catch ApplicationFailures rethrown from DB checks or unexpected errors
          log.error('Error during transfer verification attempt', { eventId, attempt, error })
          if (error instanceof ApplicationFailure) {
            throw error // Re-throw known Temporal failures
          }
          // Treat other unexpected errors as non-retryable for this attempt
          throw ApplicationFailure.nonRetryable(
            error.message ?? `Unexpected error during verification attempt ${attempt}`,
            'VERIFICATION_ATTEMPT_FAILED',
            { error }
          )
        }

        // If not the last attempt, wait before retrying
        if (attempt < maxAttempts) {
          const delay = initialDelayMs * backoffCoefficient ** (attempt - 1)
          log.info(`Waiting ${delay}ms before next verification attempt`, { eventId })
          await sleep(delay) // Use Temporal's sleep for cancellation awareness
        }
      }

      // If loop completes without finding the record
      log.error('Transfer indexing verification timed out after max attempts', {
        eventId,
        maxAttempts,
      })
      throw ApplicationFailure.nonRetryable(
        'Transfer indexing verification failed after maximum attempts',
        'VERIFICATION_TIMEOUT',
        { eventId, maxAttempts }
      )
    },
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
    async getEventFromTransferActivity({ bundlerReceipt, token, from, to }) {
      const logs = bundlerReceipt.logs
      const block_num = bundlerReceipt.receipt.blockNumber.toString()
      const tx_idx = bundlerReceipt.receipt.transactionIndex.toString()

      const matchingLog = token
        ? logs.find(
            ({ topics }) =>
              topics[0] &&
              topics[1] &&
              topics[2] &&
              isTransferTopic(topics[0]) &&
              isAddressInTopic(topics[1], from) &&
              isAddressInTopic(topics[2], to)
          )
        : logs.find(
            ({ topics, address }) =>
              address.toLowerCase() === to.toLowerCase() &&
              topics[0] &&
              topics[1] &&
              isReceiveTopic(topics[0]) &&
              isAddressInTopic(topics[1], from)
          )

      if (!matchingLog || matchingLog.logIndex === null) {
        throw ApplicationFailure.nonRetryable(
          'No matching transfer log found in receipt',
          'LOG_NOT_FOUND',
          {
            token,
            from,
            to,
            block_num,
            tx_idx,
          }
        )
      }

      const log_idx = matchingLog.logIndex.toString()
      const eventName = token ? 'send_account_transfers' : 'send_account_receives'
      const eventId = `${eventName}/base_logs/${block_num}/${tx_idx}/${log_idx}`

      return {
        eventName,
        eventId,
      }
    },
  }
}
