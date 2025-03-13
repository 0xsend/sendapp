import { log, ApplicationFailure } from '@temporalio/activity'
import {
  upsertTemporalSendAccountTransfer,
  updateTemporalSendAccountTransfer,
  isRetryableDBError,
  type TemporalTransfer,
  type TemporalTransferInsert,
  type TemporalTransferUpdate,
} from './supabase'
import {
  simulateUserOperation,
  sendUserOperation,
  waitForTransactionReceipt,
  getBaseBlockNumber,
} from './wagmi'
import type { UserOperation } from 'permissionless'
import { bootstrap } from '@my/workflows/utils'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { PgBytea } from '@my/supabase/database.types'
import superjson from 'superjson'
import { byteaToHex } from 'app/utils/byteaToHex'
import { allCoins } from 'app/data/coins'

type TransferActivities = {
  upsertTemporalSendAccountTransferActivity: (TemporalTransferInsert) => Promise<TemporalTransfer>
  simulateTransferActivity: (workflowId: string, userOp: UserOperation<'v0.7'>) => Promise<void>
  getBaseBlockNumberActivity: () => Promise<bigint>
  decodeTransferUserOpActivity: (
    workflowId: string,
    userOp: UserOperation<'v0.7'>
  ) => Promise<{
    from: PgBytea
    to: PgBytea
    amount: bigint
    token: PgBytea | null
  }>
  updateTemporalSendAccountTransferActivity: (TemporalTransferUpdate) => Promise<TemporalTransfer>
  sendUserOpActivity: (workflowId: string, userOp: UserOperation<'v0.7'>) => Promise<PgBytea>
  waitForTransactionReceiptActivity: (
    workflowId: string,
    hash: PgBytea
  ) => Promise<{
    transactionHash: `0x${string}`
    blockNumber: bigint
  }>
}

export const createTransferActivities = (
  env: Record<string, string | undefined>
): TransferActivities => {
  bootstrap(env)

  return {
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
    async simulateTransferActivity(workflowId, userOp) {
      await simulateUserOperation(userOp).catch(async (error) => {
        log.error('decodeTransferUserOpActivity failed', { error })
        const { error: updateError } = await updateTemporalSendAccountTransfer({
          workflow_id: workflowId,
          status: 'failed',
        })
        if (updateError) {
          throw ApplicationFailure.retryable(
            'Error updating transfer status to failed from temporal.send_account_transferss',
            updateError.code,
            {
              error: updateError,
              workflowId,
            }
          )
        }
        throw ApplicationFailure.nonRetryable('Error simulating user operation', error.code, error)
      })
    },
    async getBaseBlockNumberActivity() {
      try {
        return await getBaseBlockNumber()
      } catch (error) {
        log.error('Failed to get block number', { code: error.code, error })
        throw ApplicationFailure.retryable('Failed to get block number')
      }
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

        const fromBytea = hexToBytea(from)
        const toBytea = hexToBytea(to)
        const tokenBytea = token === 'eth' ? null : hexToBytea(token)
        return { from: fromBytea, to: toBytea, amount, token: tokenBytea }
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
    async sendUserOpActivity(workflowId, userOp) {
      try {
        const hash = await sendUserOperation(userOp)
        const hashBytea = hexToBytea(hash)
        return hashBytea
      } catch (error) {
        log.error('sendUserOpActivity failed', { error })
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

        throw ApplicationFailure.nonRetryable('Error sending user operation', error.code, error)
      }
    },
    async waitForTransactionReceiptActivity(workflowId, hash) {
      const hexHash = byteaToHex(hash)
      try {
        const bundlerReceipt = await waitForTransactionReceipt(hexHash)
        if (!bundlerReceipt) {
          throw ApplicationFailure.retryable('No receipt returned from waitForTransactionReceipt')
        }
        log.info('waitForTransactionReceiptActivity', {
          bundlerReceipt: superjson.stringify(bundlerReceipt),
        })
        if (!bundlerReceipt.success) {
          throw new Error('Transaction failed')
        }
        return bundlerReceipt.receipt
      } catch (error) {
        log.error('waitForTransactionReceiptActivity failed', { error })
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

        throw ApplicationFailure.nonRetryable('Error sending user operation', error.code, error)
      }
    },
  }
}
