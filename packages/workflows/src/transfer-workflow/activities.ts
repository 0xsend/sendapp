import { log, ApplicationFailure } from '@temporalio/activity'
import {
  upsertTemporalSendAccountTransfer,
  updateTemporalSendAccountTransfer,
  isRetryableDBError,
  type TemporalTransfer,
  type TemporalTransferInsert,
  type TemporalTransferUpdate,
} from './supabase'
import type { UserOperation } from 'permissionless'
import { bootstrap } from '@my/workflows/utils'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import { allCoins } from 'app/data/coins'
import { createUserOpActivities, type UserOpActivities } from '../shared/userop-activities'
import type { Address } from 'viem'

type TransferActivities = {
  upsertTemporalSendAccountTransferActivity: (TemporalTransferInsert) => Promise<TemporalTransfer>
  decodeTransferUserOpActivity: (
    workflowId: string,
    userOp: UserOperation<'v0.7'>
  ) => Promise<{
    from: Address
    to: Address
    amount: bigint
    token: Address | null
  }>
  updateTemporalSendAccountTransferActivity: (TemporalTransferUpdate) => Promise<TemporalTransfer>
} & UserOpActivities

export const createTransferActivities = (
  env: Record<string, string | undefined>
): TransferActivities => {
  bootstrap(env)

  const userOpActivities = createUserOpActivities(env)

  return {
    ...userOpActivities,
    async upsertTemporalSendAccountTransferActivity({ workflowId, data }) {
      const { data: upsertData, error } = await upsertTemporalSendAccountTransfer({
        workflow_id: workflowId,
        status: 'initialized',
        data,
      })

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
            workflowId,
          })
        }

        const { error: upsertFailedError } = await upsertTemporalSendAccountTransfer({
          workflow_id: workflowId,
          status: 'failed',
        })
        if (upsertFailedError) {
          throw ApplicationFailure.retryable(
            'Error upserting failed transfer from temporal.send_account_transfers',
            upsertFailedError.code,
            {
              error: upsertFailedError,
              workflowId,
            }
          )
        }
        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
          workflowId,
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
    async updateTemporalSendAccountTransferActivity({
      workflowId,
      status,
      createdAtBlockNum,
      data,
    }) {
      const { data: upsertedData, error } = await updateTemporalSendAccountTransfer({
        workflow_id: workflowId,
        status,
        created_at_block_num: createdAtBlockNum ? Number(createdAtBlockNum) : null,
        data,
      })

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
            workflowId,
          })
        }

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

        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
          workflowId,
        })
      }

      return upsertedData
    },
  }
}
