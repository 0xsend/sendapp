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
      } catch (error) {
        log.error('waitForTransactionReceipt failed', { error })
        throw ApplicationFailure.nonRetryable(error.message, error.code, error.details)
      }
    },

    /**
     * Waits for the user operation receipt for the given hash.
     */
    async waitForUserOperationReceiptActivity(
      params: WaitForUserOperationReceiptParameters & { sender: Address }
    ) {
      try {
        // Select bundler based on sender address
        const { sender, ...waitParams } = params
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
      } catch (error) {
        log.error('waitForUserOperationReceipt failed', { error })
        throw ApplicationFailure.nonRetryable(error.message, error.code, error.details)
      }
    },
  }
}
