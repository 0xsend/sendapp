import { log, ApplicationFailure } from '@temporalio/activity'
import {
  insertTemporalTokenSendAccountTransfer,
  insertTemporalEthSendAccountTransfer,
  updateTemporalSendAccountTransfer,
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
import type { Json, Database, PgBytea } from '@my/supabase/database.types'
import superjson from 'superjson'
import { byteaToHex } from 'app/utils/byteaToHex'

type TransferActivities = {
  simulateTransferActivity: (userOp: UserOperation<'v0.7'>) => Promise<void>
  getBaseBlockNumberActivity: () => Promise<bigint>
  decodeTransferUserOpActivity: (userOp: UserOperation<'v0.7'>) => Promise<{
    from: PgBytea
    to: PgBytea
    amount: bigint
    token: PgBytea | null
  }>
  insertTemporalSendAccountTransferActivity: (
    workflowId: string,
    from: PgBytea,
    to: PgBytea,
    amount: bigint,
    token: PgBytea | null,
    blockNumber: bigint
  ) => Promise<void>
  sendUserOpActivity: (workflowId: string, userOp: UserOperation<'v0.7'>) => Promise<PgBytea>
  waitForTransactionReceiptActivity: (
    workflowId: string,
    hash: PgBytea
  ) => Promise<{
    transactionHash: `0x${string}`
    blockNumber: bigint
  }>
  updateTemporalTransferActivity: (params: {
    workflowId: string
    status: Database['temporal']['Enums']['transfer_status']
    data: Json
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
    async simulateTransferActivity(userOp) {
      await simulateUserOperation(userOp).catch((error) => {
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
    async decodeTransferUserOpActivity(userOp) {
      const { from, to, token, amount } = decodeTransferUserOp({ userOp })
      if (!from || !to || !amount || !token) {
        log.error('User Operation is not a valid transfer', { from, to, amount, token })
        throw ApplicationFailure.nonRetryable('User Operation is not a valid transfer')
      }
      if (amount <= 0n) {
        log.error('User Operation has amount <= 0', { amount })
        throw ApplicationFailure.nonRetryable('User Operation has amount <= 0')
      }
      if (!userOp.signature) {
        log.error('UserOp signature is required')
        throw ApplicationFailure.nonRetryable('UserOp signature is required')
      }

      try {
        const fromBytea = hexToBytea(from)
        const toBytea = hexToBytea(to)
        const tokenBytea = token === 'eth' ? null : hexToBytea(token)
        return { from: fromBytea, to: toBytea, amount, token: tokenBytea }
      } catch (error) {
        throw ApplicationFailure.nonRetryable('Invalid hex address format')
      }
    },
    async insertTemporalSendAccountTransferActivity(
      workflowId,
      from,
      to,
      amount,
      token,
      blockNumber
    ) {
      const { error } = token
        ? await insertTemporalTokenSendAccountTransfer({
            workflow_id: workflowId,
            status: 'initialized',
            block_num: blockNumber,
            f: from,
            t: to,
            v: amount,
            log_addr: token,
          })
        : await insertTemporalEthSendAccountTransfer({
            workflow_id: workflowId,
            status: 'initialized',
            block_num: blockNumber,
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
        return hashBytea
      } catch (error) {
        log.error('sendUserOpActivity failed', { error })
        const { error: updateError } = await updateTemporalSendAccountTransfer({
          workflow_id: workflowId,
          status: 'failed',
        })
        if (updateError) {
          throw ApplicationFailure.retryable(
            'Error deleting transfer from temporal.send_account_transfers',
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
        throw ApplicationFailure.nonRetryable(updateError?.message)
      }
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
