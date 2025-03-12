import { log, ApplicationFailure } from '@temporalio/activity'
import {
  upsertTemporalTokenSendAccountTransfer,
  upsertTemporalEthSendAccountTransfer,
  updateTemporalSendAccountTransfer,
  isRetryableDBError,
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
import { allCoins } from 'app/data/coins'

type TemporalTransfer = Database['temporal']['Tables']['send_account_transfers']['Row']

type TransferActivities = {
  simulateTransferActivity: (userOp: UserOperation<'v0.7'>) => Promise<void>
  getBaseBlockNumberActivity: () => Promise<bigint>
  decodeTransferUserOpActivity: (userOp: UserOperation<'v0.7'>) => Promise<{
    from: PgBytea
    to: PgBytea
    amount: bigint
    token: PgBytea | null
  }>
  upsertTemporalSendAccountTransferActivity: (
    workflowId: string,
    from: PgBytea,
    to: PgBytea,
    amount: bigint,
    token: PgBytea | null,
    blockNumber: bigint
  ) => Promise<TemporalTransfer>
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
  }) => Promise<TemporalTransfer>
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
      try {
        const { from, to, token, amount } = decodeTransferUserOp({ userOp })
        if (!from || !to || !amount || !token) {
          log.error('Failed to decode transfer user op', { from, to, amount, token })
          throw ApplicationFailure.nonRetryable('User Operation is not a valid transfer')
        }
        if (!allCoins.find((c) => c.token === token)) {
          log.error('Token ${token} is not a supported', { token })
          throw ApplicationFailure.nonRetryable('Token ${token} is not a supported')
        }
        if (amount <= 0n) {
          log.error('User Operation has amount <= 0', { amount })
          throw ApplicationFailure.nonRetryable('User Operation has amount <= 0')
        }
        if (!userOp.signature) {
          log.error('UserOp signature is required')
          throw ApplicationFailure.nonRetryable('UserOp signature is required')
        }

        const fromBytea = hexToBytea(from)
        const toBytea = hexToBytea(to)
        const tokenBytea = token === 'eth' ? null : hexToBytea(token)
        return { from: fromBytea, to: toBytea, amount, token: tokenBytea }
      } catch (error) {
        // Handle viem decode errors
        if (
          error.name === 'AbiFunctionSignatureNotFoundError' ||
          error.name === 'DecodeAbiParametersError' ||
          error.name === 'FormatAbiItemError' ||
          error.name === 'ToFunctionSelectorError' ||
          error.name === 'SliceError'
        ) {
          log.error('Failed to decode function data', { error })
          throw ApplicationFailure.nonRetryable('Invalid transfer function data', error.name, error)
        }
        // Handle hex conversion errors
        if (error.message === 'Hex string must start with 0x') {
          log.error('Invalid hex address format', { error })
          throw ApplicationFailure.nonRetryable('Invalid hex address format')
        }
        throw error
      }
    },
    async upsertTemporalSendAccountTransferActivity(
      workflowId,
      from,
      to,
      amount,
      token,
      blockNumber
    ) {
      const { data, error } = token
        ? await upsertTemporalTokenSendAccountTransfer({
            workflow_id: workflowId,
            status: 'initialized',
            block_num: blockNumber,
            f: from,
            t: to,
            v: amount,
            log_addr: token,
          })
        : await upsertTemporalEthSendAccountTransfer({
            workflow_id: workflowId,
            status: 'initialized',
            block_num: blockNumber,
            sender: from,
            value: amount,
            log_addr: to,
          })

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
            workflowId,
          })
        }

        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
          workflowId,
        })
      }

      return data
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
      const { data: updatedData, error } = await updateTemporalSendAccountTransfer({
        workflow_id: workflowId,
        status,
        data,
      })
      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
            workflowId,
          })
        }
        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
          workflowId,
        })
      }
      return updatedData
    },
  }
}
