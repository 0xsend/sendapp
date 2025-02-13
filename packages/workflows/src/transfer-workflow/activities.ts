import { log, ApplicationFailure } from '@temporalio/activity'
import {
  isTokenTransferIndexed,
  isEthTransferIndexed,
  insertTemporalTokenSendAccountTransfer,
  updateTemporalSendAccountTransfer,
  insertTemporalEthSendAccountTransfer,
  deleteTemporalTransferFromActivityTable,
  deleteTemporalTransfer,
} from './supabase'
import { simulateUserOperation, sendUserOperation, waitForTransactionReceipt } from './wagmi'
import type { UserOperation } from 'permissionless'
import { bootstrap } from '@my/workflows/utils'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { Json, Database, PgBytea } from '@my/supabase/database.types'
import superjson from 'superjson'

type TransferActivities = {
  initializeTransferActivity: (userOp: UserOperation<'v0.7'>) => Promise<{
    from: PgBytea
    to: PgBytea
    amount: bigint
    token: PgBytea | null
  }>
  insertTemporalSendAccountTransfer: (
    workflowId: string,
    from: PgBytea,
    to: PgBytea,
    amount: bigint,
    token: PgBytea | null
  ) => Promise<void>
  sendUserOpActivity: (
    workflowId: string,
    userOp: UserOperation<'v0.7'>
  ) => Promise<{ hash: `0x${string}`; hashBytea: PgBytea }>
  waitForTransactionReceiptActivity: (
    workflowId: string,
    hash: `0x${string}`
  ) => Promise<{
    transactionHash: `0x${string}`
    blockNumber: bigint
  }>
  isTransferIndexedActivity: (tx_hash: `0x${string}`, token: PgBytea | null) => Promise<boolean>
  updateTemporalTransferActivity: (params: {
    workflowId: string
    status: Database['temporal']['Enums']['transfer_status']
    data?: Json
    failureError?: {
      message?: string | null
      type?: string | null
      details?: unknown[]
    }
  }) => Promise<void>
}

export const createTransferActivities = (
  env: Record<string, string | undefined>
): TransferActivities => {
  bootstrap(env)

  return {
    async initializeTransferActivity(userOp) {
      const { from, to, token, amount } = decodeTransferUserOp({ userOp })
      if (!from || !to || !amount || !token) {
        throw ApplicationFailure.nonRetryable('User Operation is not a valid transfer')
      }
      if (amount <= 0n) {
        throw ApplicationFailure.nonRetryable('User Operation has amount <= 0')
      }
      if (!userOp.signature) {
        throw ApplicationFailure.nonRetryable('UserOp signature is required')
      }

      await simulateUserOperation(userOp).catch((error) => {
        throw ApplicationFailure.nonRetryable('Error simulating user operation', error.code, error)
      })

      let fromBytea: PgBytea
      let toBytea: PgBytea
      let tokenBytea: PgBytea | null

      try {
        fromBytea = hexToBytea(from)
        toBytea = hexToBytea(to)
        tokenBytea = token === 'eth' ? null : hexToBytea(token)
      } catch (error) {
        throw ApplicationFailure.nonRetryable('Invalid hex address format')
      }

      return { from: fromBytea, to: toBytea, amount, token: tokenBytea }
    },
    async insertTemporalSendAccountTransfer(workflowId, from, to, amount, token) {
      const { error } = token
        ? await insertTemporalTokenSendAccountTransfer({
            workflow_id: workflowId,
            status: 'initialized',
            f: from,
            t: to,
            v: amount,
            log_addr: token,
          })
        : await insertTemporalEthSendAccountTransfer({
            workflow_id: workflowId,
            status: 'initialized',
            sender: from,
            value: amount,
            log_addr: to,
          })

      if (error) {
        if (error.code === '23505') {
          throw ApplicationFailure.nonRetryable(
            'Duplicate entry for temporal.send_account_transfers',
            error.code
          )
        }
        throw ApplicationFailure.retryable(
          'Error inserting transfer into temporal.send_account_transfers',
          error.code,
          {
            error,
            workflowId,
          }
        )
      }
    },
    async sendUserOpActivity(workflowId, userOp) {
      try {
        const hash = await sendUserOperation(userOp)
        const hashBytea = hexToBytea(hash)
        return { hash, hashBytea }
      } catch (error) {
        log.error('sendUserOpActivity failed', { error })
        const { error: deleteError } = await deleteTemporalTransfer(workflowId)
        if (deleteError) {
          throw ApplicationFailure.retryable(
            'Error deleting transfer from temporal.send_account_transfers',
            deleteError.code,
            {
              deleteError,
              workflowId,
            }
          )
        }

        throw ApplicationFailure.nonRetryable('Error sending user operation', error.code, error)
      }
    },
    async waitForTransactionReceiptActivity(workflowId, hash) {
      try {
        const bundlerReceipt = await waitForTransactionReceipt(hash)
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
        throw ApplicationFailure.nonRetryable(updateError?.message)
      }
    },
    async isTransferIndexedActivity(tx_hash, token) {
      const isIndexed = token
        ? await isTokenTransferIndexed(tx_hash)
        : await isEthTransferIndexed(tx_hash)

      if (!isIndexed) {
        throw ApplicationFailure.retryable('Transfer not indexed in db')
      }
      log.info('isTransferIndexedActivity', { isIndexed })
      return isIndexed
    },
    async updateTemporalTransferActivity({ workflowId, status, data, failureError }) {
      const { error } = await updateTemporalSendAccountTransfer({
        workflow_id: workflowId,
        status,
        data,
      })
      if (error) {
        throw ApplicationFailure.retryable(
          `Error updating entry in temporal_send_account_transfers with ${status} status`,
          error.code,
          {
            error,
            workflowId,
          }
        )
      }
      if (status === 'failed') {
        throw ApplicationFailure.nonRetryable(
          failureError?.message ?? null,
          failureError?.type ?? null,
          ...(failureError?.details ?? [])
        )
      }
    },
  }
}
