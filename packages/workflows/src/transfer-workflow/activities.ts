import { log, ApplicationFailure } from '@temporalio/activity'
import {
  isTokenTransferIndexed,
  isEthTransferIndexed,
  insertTemporalTokenSendAccountTransfer,
  updateTemporalSendAccountTransfer,
  insertTemporalEthSendAccountTransfer,
  deleteTemporalTransferFromActivityTable,
} from './supabase'
import { simulateUserOperation, sendUserOperation, waitForTransactionReceipt } from './wagmi'
import type { UserOperation } from 'permissionless'
import { bootstrap } from '@my/workflows/utils'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { Json, Database, PgBytea } from '@my/supabase/database.types'
import superjson from 'superjson'

export const createTransferActivities = (env: Record<string, string | undefined>) => {
  bootstrap(env)

  return {
    async initializeTransferActivity(workflowId: string, userOp: UserOperation<'v0.7'>) {
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
    async insertTemporalSendAccountTransfer(
      workflowId: string,
      from: PgBytea,
      to: PgBytea,
      amount: bigint,
      token: PgBytea | null
    ) {
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
    async sendUserOpActivity(userOp: UserOperation<'v0.7'>) {
      try {
        const hash = await sendUserOperation(userOp)
        log.info('UserOperation sent successfully', { hash })
        return hash
      } catch (error) {
        log.error('Error sending user operation', { error })
        throw error
      }
    },
    async waitForTransactionReceiptActivity(hash: `0x${string}`) {
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
        log.error('Error waiting for transaction receipt', { error })
        throw error
      }
    },

    async isTransferIndexedActivity(tx_hash: `0x${string}`, token: PgBytea | null) {
      const isIndexed = token
        ? await isTokenTransferIndexed(tx_hash)
        : await isEthTransferIndexed(tx_hash)

      if (!isIndexed) {
        throw ApplicationFailure.retryable('Transfer not indexed in db')
      }
      log.info('isTransferIndexedActivity', { isIndexed })
      return isIndexed
    },
    async updateTemporalTransferActivity({
      workflowId,
      status,
      data,
      failureError,
    }: {
      workflowId: string
      status: Database['temporal']['Enums']['transfer_status']
      data?: Json
      failureError?: {
        message?: string | null
        type?: string | null
        details: unknown[]
      }
    }) {
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
    async deleteTemporalTransferActivity(workflowId: string) {
      const { error } = await deleteTemporalTransferFromActivityTable(workflowId)
      if (error) {
        throw ApplicationFailure.retryable(
          'Error deleting temporal_transfer entry in activity table',
          error.code,
          {
            error,
            workflowId,
          }
        )
      }
    },
  }
}
