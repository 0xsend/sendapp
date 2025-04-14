import type { PgBytea } from '@my/supabase/database.types'
import { ApplicationFailure, log } from '@temporalio/activity'
import { byteaToHex } from 'app/utils/byteaToHex'
import { decodeExecuteBatchCalldata } from 'app/utils/decode-calldata'
import { hexToBytea } from 'app/utils/hexToBytea'
import type {
  GetUserOperationReceiptReturnType,
  UserOperation,
  WaitForUserOperationReceiptParameters,
} from 'permissionless'
import superjson from 'superjson'
import type { Hex } from 'viem'
import { bootstrap } from '../utils'
import {
  getBaseBlockNumber,
  sendUserOperation,
  simulateUserOperation,
  waitForTransactionReceipt,
  waitForUserOperationReceipt,
} from './wagmi'

export type UserOpActivities = {
  simulateUserOperationActivity: (userOp: UserOperation<'v0.7'>) => Promise<void>
  decodeExecuteBatchCallDataActivity: (data: Hex) => Promise<{
    [K in keyof ReturnType<typeof decodeExecuteBatchCalldata>]: NonNullable<
      ReturnType<typeof decodeExecuteBatchCalldata>[K]
    >
  }>
  getBaseBlockNumberActivity: () => Promise<bigint>
  sendUserOpActivity: (userOp: UserOperation<'v0.7'>) => Promise<PgBytea>
  waitForTransactionReceiptActivity: (hash: PgBytea) => Promise<GetUserOperationReceiptReturnType>
  waitForUserOperationReceiptActivity: (
    params: WaitForUserOperationReceiptParameters
  ) => Promise<GetUserOperationReceiptReturnType>
}

export const createUserOpActivities = (
  env: Record<string, string | undefined>
): UserOpActivities => {
  bootstrap(env)
  return {
    async simulateUserOperationActivity(userOp) {
      try {
        await simulateUserOperation(userOp)
      } catch (error) {
        log.error('Failed to simulate user operation', { error })
        throw ApplicationFailure.nonRetryable(
          'Failed to simulate user operation',
          error.code,
          error.details
        )
      }
    },
    async decodeExecuteBatchCallDataActivity(data) {
      try {
        const { args, functionName } = decodeExecuteBatchCalldata(data)
        if (!args || !functionName) {
          throw ApplicationFailure.nonRetryable('Failed to decode executeBatch user op')
        }

        return { functionName, args }
      } catch (error) {
        log.error('Failed to decode executeBatch user op', { error })
        throw ApplicationFailure.nonRetryable(error.message, error.code, error.details)
      }
    },
    async getBaseBlockNumberActivity() {
      try {
        return await getBaseBlockNumber()
      } catch (error) {
        log.error('Failed to get block number', { code: error.code, error })
        throw ApplicationFailure.retryable('Failed to get block number')
      }
    },
    async sendUserOpActivity(userOp) {
      try {
        const hash = await sendUserOperation(userOp)
        const hashBytea = hexToBytea(hash)
        return hashBytea
      } catch (error) {
        log.error('sendUserOpActivity failed', { error })
        // Throw non retryable error for now
        // This should retry a few times
        throw ApplicationFailure.nonRetryable(
          'Failed to send user operation',
          error.code,
          error.details
        )
      }
    },
    /**
     * Waits for the transaction receipt for the given hash.
     * @deprecated - use waitForUserOperationReceiptActivity instead
     */
    async waitForTransactionReceiptActivity(hash) {
      try {
        const hexHash = byteaToHex(hash)
        const bundlerReceipt = await waitForTransactionReceipt(hexHash)
        log.info('waitForTransactionReceiptActivity', {
          bundlerReceipt: superjson.stringify(bundlerReceipt),
        })
        if (!bundlerReceipt.success) {
          throw ApplicationFailure.nonRetryable(
            `Transaction failed: ${bundlerReceipt.receipt.transactionHash}`
          )
        }
        return bundlerReceipt
      } catch (error) {
        log.error('waitForTransactionReceipt failed', { error })
        throw ApplicationFailure.nonRetryable(error.message, error.code, error.details)
      }
    },

    /**
     * Waits for the user operation receipt for the given hash.
     */
    async waitForUserOperationReceiptActivity(params: WaitForUserOperationReceiptParameters) {
      try {
        const bundlerReceipt = await waitForUserOperationReceipt(params)
        log.info('waitForUserOperationReceiptActivity', {
          bundlerReceipt,
        })
        if (!bundlerReceipt.success) {
          throw ApplicationFailure.nonRetryable(
            `Transaction failed: ${bundlerReceipt.receipt.transactionHash}`
          )
        }
        return bundlerReceipt
      } catch (error) {
        log.error('waitForUserOperationReceipt failed', { error })
        throw ApplicationFailure.nonRetryable(error.message, error.code, error.details)
      }
    },
  }
}
