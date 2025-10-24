import type { PgBytea } from '@my/supabase/database.types'
import { ApplicationFailure, log } from '@temporalio/activity'
import { byteaToHex } from 'app/utils/byteaToHex'
import { decodeExecuteBatchCalldata } from 'app/utils/decode-calldata'
import { hexToBytea } from 'app/utils/hexToBytea'
import { shouldUseErc7677 } from 'app/utils/shouldUseErc7677'
import type {
  GetUserOperationReceiptReturnType,
  UserOperation,
  WaitForUserOperationReceiptParameters,
  BundlerClient,
} from 'permissionless'
import type { ENTRYPOINT_ADDRESS_V07_TYPE } from 'permissionless/types'
import superjson from 'superjson'
import type { Address, Hex } from 'viem'
import { baseMainnetClient, entryPointAddress } from '@my/wagmi'
import { bootstrap } from '../utils'
import type { WaitForUserOperationReceiptErrorType } from 'viem/account-abstraction'
import { isRetryableUserOpError, isRetryableBundlerError, isNonRetryableError } from './errors'

export type UserOpActivities = {
  simulateUserOperationActivity: (userOp: UserOperation<'v0.7'>) => Promise<void>
  decodeExecuteBatchCallDataActivity: (data: Hex) => Promise<{
    [K in keyof ReturnType<typeof decodeExecuteBatchCalldata>]: NonNullable<
      ReturnType<typeof decodeExecuteBatchCalldata>[K]
    >
  }>
  getBaseBlockNumberActivity: () => Promise<bigint>
  sendUserOpActivity: (userOp: UserOperation<'v0.7'>) => Promise<PgBytea>
  waitForTransactionReceiptActivity: (
    hash: PgBytea,
    sender: Address
  ) => Promise<GetUserOperationReceiptReturnType>
  waitForUserOperationReceiptActivity: (
    params: WaitForUserOperationReceiptParameters & { sender: Address }
  ) => Promise<GetUserOperationReceiptReturnType>
}

export const createUserOpActivities = (
  env: Record<string, string | undefined>,
  sendBundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>,
  erc7677BundlerClient: BundlerClient<ENTRYPOINT_ADDRESS_V07_TYPE>
): UserOpActivities => {
  bootstrap(env)

  /**
   * Helper to select the appropriate bundler client based on sender address.
   * Uses ERC-7677 bundler for addresses in allowlist, Send bundler otherwise.
   */
  const getBundlerClient = (sender: Address | undefined) => {
    return shouldUseErc7677(sender) ? erc7677BundlerClient : sendBundlerClient
  }

  return {
    async simulateUserOperationActivity(userOp) {
      try {
        await baseMainnetClient.call({
          account: entryPointAddress[baseMainnetClient.chain.id],
          to: userOp.sender,
          data: userOp.callData,
        })
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
        return await baseMainnetClient.getBlockNumber()
      } catch (error) {
        log.error('Failed to get block number', { code: error.code, error })
        throw ApplicationFailure.retryable('Failed to get block number')
      }
    },
    async sendUserOpActivity(userOp) {
      try {
        // Select bundler based on sender address
        const bundlerClient = getBundlerClient(userOp.sender)

        log.info('Sending userOp', {
          sender: userOp.sender,
          useErc7677: shouldUseErc7677(userOp.sender),
        })

        const hash = await bundlerClient.sendUserOperation({
          userOperation: userOp,
        })
        const hashBytea = hexToBytea(hash)
        return hashBytea
      } catch (error) {
        log.error('sendUserOpActivity failed', {
          error: error.message,
          errorName: error.name,
          errorCode: error.code,
          sender: userOp.sender,
        })

        // Check if this is a retryable bundler error
        if (isRetryableBundlerError(error)) {
          log.info('Retrying sendUserOp due to retryable bundler error', {
            errorName: error.name,
            errorMessage: error.message,
          })
          throw ApplicationFailure.retryable(
            'Retryable bundler error occurred',
            error.name,
            error.message
          )
        }

        // Check if this is a non-retryable error
        if (isNonRetryableError(error)) {
          log.error('Non-retryable error in sendUserOp', {
            errorName: error.name,
            errorMessage: error.message,
          })
          throw ApplicationFailure.nonRetryable(
            error.message || 'Non-retryable bundler error',
            error.name || 'UnknownError',
            error.details
          )
        }

        // Default to non-retryable for unknown errors
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
    async waitForTransactionReceiptActivity(hash, sender) {
      try {
        const hexHash = byteaToHex(hash)
        // Select bundler based on sender address
        const bundlerClient = getBundlerClient(sender)

        log.info('Waiting for transaction receipt', {
          hash: hexHash,
          sender,
          useErc7677: shouldUseErc7677(sender),
        })

        const bundlerReceipt = await bundlerClient.waitForUserOperationReceipt({
          hash: hexHash,
          timeout: 120_000, // 2 minutes - allows for slow block times
        })
        log.info('waitForTransactionReceiptActivity', {
          bundlerReceipt: superjson.stringify(bundlerReceipt),
        })
        if (!bundlerReceipt.success) {
          throw ApplicationFailure.nonRetryable(
            `Transaction failed: ${bundlerReceipt.receipt.transactionHash}`
          )
        }
        return bundlerReceipt
      } catch (e) {
        const error = e as WaitForUserOperationReceiptErrorType

        log.error('waitForTransactionReceipt failed', {
          error: error.message,
          errorName: error.name,
          hash: byteaToHex(hash),
          sender,
        })

        if (isRetryableUserOpError(error)) {
          log.info('Retrying waitForTransactionReceipt due to retryable error', {
            errorName: error.name,
            errorMessage: error.message,
          })
          throw ApplicationFailure.retryable('Retryable error occurred', error.name, error.message)
        }

        // NON-RETRYABLE ERRORS - Permanent/Client issues that won't succeed on retry
        log.error('waitForTransactionReceipt failed with non-retryable error', {
          errorName: error.name,
          errorMessage: error.message,
        })
        throw ApplicationFailure.nonRetryable(
          error.message || 'Unknown error',
          error.name || 'UnknownError'
        )
      }
    },

    /**
     * Waits for the user operation receipt for the given hash.
     */
    async waitForUserOperationReceiptActivity(
      params: WaitForUserOperationReceiptParameters & { sender: Address }
    ) {
      // Extract variables outside try block for use in catch block
      const { sender, ...waitParams } = params

      try {
        // Select bundler based on sender address
        const bundlerClient = getBundlerClient(sender)

        log.info('Waiting for userOp receipt', {
          sender,
          hash: waitParams.hash,
          useErc7677: shouldUseErc7677(sender),
        })

        const bundlerReceipt = await bundlerClient.waitForUserOperationReceipt(waitParams)
        log.info('waitForUserOperationReceiptActivity', {
          bundlerReceipt,
        })
        if (!bundlerReceipt.success) {
          throw ApplicationFailure.nonRetryable(
            `Transaction failed: ${bundlerReceipt.receipt.transactionHash}`
          )
        }
        return bundlerReceipt
      } catch (e) {
        const error = e as WaitForUserOperationReceiptErrorType

        log.error('waitForUserOperationReceipt failed', {
          error: error.message,
          errorName: error.name,
          hash: waitParams.hash,
          sender,
        })

        if (isRetryableUserOpError(error)) {
          log.info('Retrying waitForUserOperationReceipt due to retryable error', {
            errorName: error.name,
            errorMessage: error.message,
          })
          throw ApplicationFailure.retryable('Retryable error occurred', error.name, error.message)
        }

        // NON-RETRYABLE ERRORS - Permanent/Client issues that won't succeed on retry
        log.error('waitForUserOperationReceipt failed with non-retryable error', {
          errorName: error.name,
          errorMessage: error.message,
        })
        throw ApplicationFailure.nonRetryable(
          error.message || 'Unknown error',
          error.name || 'UnknownError'
        )
      }
    },
  }
}
