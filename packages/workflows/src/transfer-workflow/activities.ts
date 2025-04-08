import type { PgBytea } from '@my/supabase/database.types'
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
    async getEventFromTransferActivity({ bundlerReceipt, token, from, to }) {
      const logs = bundlerReceipt.logs
      const block_num = bundlerReceipt.receipt.blockNumber.toString()
      const tx_idx = bundlerReceipt.receipt.transactionIndex.toString()

      const log_idx = token
        ? logs.find(
            ({ topics }) =>
              topics[0] &&
              topics[1] &&
              topics[2] &&
              isTransferTopic(topics[0]) &&
              isAddressInTopic(topics[1], from) &&
              isAddressInTopic(topics[2], to)
          )?.logIndex
        : logs
            .find(
              ({ topics }) =>
                topics[0] &&
                topics[1] &&
                isReceiveTopic(topics[0]) &&
                isAddressInTopic(topics[1], to)
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
