import { log, ApplicationFailure } from '@temporalio/activity'
import {
  getBaseBlockNumber,
  sendUserOperation,
  simulateUserOperation,
  waitForTransactionReceipt,
} from './wagmi'
import type { PgBytea } from '@my/supabase/database.types'
import type { UserOperation } from 'permissionless'
import { hexToBytea } from 'app/utils/hexToBytea'
import { byteaToHex } from 'app/utils/byteaToHex'
import superjson from 'superjson'
import { bootstrap } from '../utils'
import { decodeExecuteBatchCalldata } from 'app/utils/decode-calldata'
import type { Hex } from 'viem'
import type { GetUserOperationReceiptReturnType } from 'permissionless'

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
}

export const createUserOpActivities = (
  env: Record<string, string | undefined>
): UserOpActivities => {
  bootstrap(env)
  return {
    async simulateUserOperationActivity(userOp) {
      await simulateUserOperation(userOp)
    },
    async decodeExecuteBatchCallDataActivity(data) {
      const { args, functionName } = decodeExecuteBatchCalldata(data)
      if (!args || !functionName) {
        log.error('Failed to decode executeBatch user op', { args, functionName })
        throw new Error('Failed to decode executeBatch user op')
      }

      return { functionName, args }
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
      const hash = await sendUserOperation(userOp)
      const hashBytea = hexToBytea(hash)
      return hashBytea
    },
    async waitForTransactionReceiptActivity(hash) {
      const hexHash = byteaToHex(hash)

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
      return bundlerReceipt
    },
  }
}
