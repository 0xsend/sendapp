import type { PgBytea } from '@my/supabase/database.types'
import { Context, ApplicationFailure, log, sleep } from '@temporalio/activity'
import { decodeExecuteBatchCalldata } from 'app/utils/decode-calldata'
import { hexToBytea } from 'app/utils/hexToBytea'
import type {
  GetUserOperationReceiptReturnType,
  UserOperation,
  WaitForUserOperationReceiptParameters,
} from 'permissionless'
import type { Block, Hex } from 'viem'
import { bootstrap } from '../utils'
import {
  getBaseBlock,
  getBaseBlockNumber,
  sendUserOperation,
  simulateUserOperation,
  waitForUserOperationReceipt,
} from './wagmi'
import { getUserOperationHash } from 'permissionless/utils'
import { baseMainnetBundlerClient, baseMainnetClient, entryPointAddress } from '@my/wagmi'

export type UserOpActivities = {
  simulateUserOperationActivity: (userOp: UserOperation<'v0.7'>) => Promise<void>
  decodeExecuteBatchCallDataActivity: (data: Hex) => Promise<{
    [K in keyof ReturnType<typeof decodeExecuteBatchCalldata>]: NonNullable<
      ReturnType<typeof decodeExecuteBatchCalldata>[K]
    >
  }>
  getBaseBlockNumberActivity: () => Promise<bigint>
  sendUserOpActivity: (userOp: UserOperation<'v0.7'>) => Promise<PgBytea>
  waitForUserOperationReceiptActivity: (
    params: WaitForUserOperationReceiptParameters
  ) => Promise<GetUserOperationReceiptReturnType>
  getBaseBlockActivity: (params: { blockHash: Hex }) => Promise<Block>
  getUserOperationHashActivity: (params: { userOperation: UserOperation<'v0.7'> }) => Promise<Hex>
  getUserOperationReceiptActivity: (params: {
    hash: Hex
  }) => Promise<GetUserOperationReceiptReturnType>
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
    async getBaseBlockActivity({ blockHash }) {
      try {
        return await getBaseBlock(blockHash)
      } catch (error) {
        log.error('getBaseBlockActivity failed', { blockHash, error })
        throw ApplicationFailure.retryable('Failed to get block')
      }
    },
    async getUserOperationHashActivity({ userOperation }) {
      try {
        const chainId = baseMainnetClient.chain.id
        const entryPoint = entryPointAddress[chainId]
        return getUserOperationHash({ userOperation, chainId, entryPoint })
      } catch (error) {
        log.error('getUserOperationHashActivity failed', { error })
        throw ApplicationFailure.nonRetryable('Failed to get user operation hash')
      }
    },
    async getUserOperationReceiptActivity({ hash }) {
      const maxAttempts = 10 // Example: Retry up to 10 times
      const initialDelayMs = 1000 // Example: Start with 1 second delay
      const backoffCoefficient = 2 // Example: Double delay each time

      log.info('Getting userOp receipt', { hash })

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        Context.current().heartbeat(`Attempt ${attempt}/${maxAttempts}`) // Send heartbeat

        try {
          const bundlerReceipt = await baseMainnetBundlerClient.getUserOperationReceipt({
            hash,
          })

          if (bundlerReceipt?.success) {
            log.info('Operation succeeded', {
              hash,
              tx_hash: bundlerReceipt.receipt.transactionHash,
            })
            return bundlerReceipt // Found the records
          }

          // Record not found yet, log and prepare for next attempt
          log.info(`Operation not yet onchain, attempt ${attempt}/${maxAttempts}`, {
            hash,
          })
        } catch (error) {
          // Catch ApplicationFailures rethrown from DB checks or unexpected errors
          log.error('Error getting transfer receipt attempt', {
            hash,
            attempt,
            error,
          })
          if (error instanceof ApplicationFailure) {
            throw error // Re-throw known Temporal failures
          }
          // Treat other unexpected errors as non-retryable for this attempt
          throw ApplicationFailure.nonRetryable(
            error.message ?? `Unexpected error getting userOp attempt ${attempt}`,
            'GET_USEROP_ATTEMPT_FAILED',
            { error }
          )
        }

        // If not the last attempt, wait before retrying
        if (attempt < maxAttempts) {
          const delay = initialDelayMs * backoffCoefficient ** (attempt - 1) // Use exponentiation operator
          log.info(`Waiting ${delay}ms before next attempt`, {
            hash,
          })
          await sleep(delay) // Use Temporal's sleep for cancellation awareness
        }
      }
      // If loop completes without finding the record
      log.error('Getting userOp receipt timed out after max attempts', {
        hash,
        maxAttempts,
      })
      throw ApplicationFailure.nonRetryable(
        'Getting userOp receipt failed after maximum attempts',
        'GET_USEROP_TIMEOUT',
        { hash, maxAttempts }
      )
    },
  }
}
