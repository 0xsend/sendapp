import { ApplicationFailure, log } from '@temporalio/activity'
import { isTransferIndexed, saveNote } from './supabase'
import { sendUserOperation, simulateUserOperation, waitForTransactionReceipt } from './wagmi'
import type { GetUserOperationReceiptReturnType, UserOperation } from 'permissionless'
import { bootstrap } from '@my/workflows/utils'
import superjson from 'superjson'

export const createTransferActivities = (env: Record<string, string | undefined>) => {
  bootstrap(env)

  return {
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
        log.info('sendUserOperationActivity', { hash, userOp: superjson.stringify(userOp) })
        return hash
      } catch (error) {
        throw ApplicationFailure.nonRetryable('Error sending user operation', error.code, error)
      }
    },

    async waitForTransactionReceiptActivity(hash: `0x${string}`) {
      try {
        const receipt = await waitForTransactionReceipt(hash)
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
      log.info('isTransferIndexedActivity', { isIndexed })
      return isIndexed
    },

    async saveNote(receipt: GetUserOperationReceiptReturnType, noteToSave: string) {
      return await saveNote(receipt, noteToSave)
    },
  }
}
