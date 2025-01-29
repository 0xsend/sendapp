import { log, ApplicationFailure } from '@temporalio/activity'
import { isTransferIndexed, insertTemporalTransfer } from './supabase'
import {
  simulateUserOperation,
  sendUserOperation,
  waitForTransactionReceipt,
  getUserOperationByHash,
} from './wagmi'
import type { UserOperation } from 'permissionless'
import { bootstrap } from '@my/workflows/utils'
import superjson from 'superjson'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import { hexToBytea } from 'app/utils/hexToBytea'

export const createTransferActivities = (env: Record<string, string | undefined>) => {
  bootstrap(env)

  return {
    async getUserOpByHashActivity(userOpHash: `0x${string}`, userId: string) {
      const res = await getUserOperationByHash(userOpHash)
      if (!res) {
        throw ApplicationFailure.nonRetryable('User Op Hash did not return a valid user op')
      }

      return res.userOperation as UserOperation<'v0.7'>
    },
    async decodeAndInitTransferActivity(
      userOp: UserOperation<'v0.7'>,
      userId: string,
      userOpHash: `0x${string}`
    ) {
      const { from, to, token, amount } = decodeTransferUserOp({ userOp })

      // Convert hex addresses to bytea for database
      const fromBytea = hexToBytea(from)
      const toBytea = hexToBytea(to)

      await insertTemporalTransfer({
        _user_id: userId,
        _user_op_hash: userOpHash,
        _f: fromBytea,
        _t: toBytea,
        _v: amount,
        _data: {
          from,
          to,
          token,
          amount: amount.toString(),
        },
      })

      return { workflowId, decoded: { from, to, token, amount } }
    },

    async simulateUserOpActivity(userOp: UserOperation<'v0.7'>) {
      if (!userOp.signature) {
        throw ApplicationFailure.nonRetryable('UserOp signature is required')
      }
      try {
        await simulateUserOperation(userOp)
      } catch (error) {
        throw ApplicationFailure.nonRetryable('Error simulating user operation', error.code, error)
      }
    },
    async sendUserOpActivity(userOp: UserOperation<'v0.7'>) {
      try {
        const hash = await sendUserOperation(userOp)
        if (!hash) throw ApplicationFailure.nonRetryable('No hash returned from sendUserOperation')
        log.info('sendUserOperationActivity', { hash, userOp: superjson.stringify(userOp) })
        return hash
      } catch (error) {
        throw ApplicationFailure.nonRetryable('Error sending user operation', error.code, error)
      }
    },

    async waitForTransactionReceiptActivity(hash: `0x${string}`) {
      try {
        const receipt = await waitForTransactionReceipt(hash)
        if (!receipt) {
          throw ApplicationFailure.nonRetryable(
            'No receipt returned from waitForTransactionReceipt'
          )
        }
        if (!receipt.success)
          throw ApplicationFailure.nonRetryable('Tx failed', receipt.sender, receipt.userOpHash)
        log.info('waitForTransactionReceiptActivity', { receipt: superjson.stringify(receipt) })
        return receipt
      } catch (error) {
        throw ApplicationFailure.nonRetryable('Error waiting for tx receipt', error.code, error)
      }
    },
    async isTransferIndexedActivity(hash: `0x${string}`) {
      const isIndexed = await isTransferIndexed(hash)
      if (!isIndexed) throw ApplicationFailure.retryable('Transfer not yet indexed in db')
      log.info('isTransferIndexedActivity', { isIndexed })
      return isIndexed
    },
  }
}
