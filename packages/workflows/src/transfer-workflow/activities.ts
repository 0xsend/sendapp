import { log, ApplicationFailure } from '@temporalio/activity'
import { isTransferIndexed } from './supabase'
import { simulateUserOperation, sendUserOperation, waitForTransactionReceipt } from './wagmi'
import type { UserOperation } from 'permissionless'
import { bootstrap } from '@my/workflows/utils'

const toHex = (value: string | number | bigint): `0x${string}` => {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return value as `0x${string}`
  }
  return `0x${BigInt(value).toString(16)}`
}

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
      const creationTime = Date.now()

      const processedUserOp = Object.entries(userOp).reduce(
        (acc, [key, value]) => {
          if (
            typeof value === 'bigint' ||
            typeof value === 'number' ||
            (typeof value === 'string' && !Number.isNaN(Number(value)))
          ) {
            acc[key] = toHex(value)
          } else if (key === 'nonce') {
            // Ensure nonce is always converted to hex
            acc[key] = toHex(value)
          } else {
            acc[key] = value
          }
          return acc
        },
        {} as Record<string, string | bigint | undefined>
      ) as UserOperation<'v0.7'>

      try {
        const hash = await sendUserOperation(processedUserOp)
        log.info('UserOperation sent', {
          hash,
          sendTime: Date.now(),
          userOp: JSON.stringify(processedUserOp, null, 2),
        })
        return hash
      } catch (error) {
        const errorMessage =
          error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error occurred'

        log.error('Error in sendUserOpActivity', {
          error: errorMessage,
          creationTime,
          sendTime: Date.now(),
          userOp: JSON.stringify(processedUserOp, null, 2),
        })

        throw ApplicationFailure.nonRetryable(errorMessage)
      }
    },

    async waitForTransactionReceiptActivity(hash: `0x${string}`) {
      if (!hash) {
        throw ApplicationFailure.nonRetryable('Invalid hash: hash is undefined')
      }
      try {
        const receipt = await waitForTransactionReceipt(hash)
        if (!receipt.success)
          throw ApplicationFailure.nonRetryable('Tx failed', receipt.sender, receipt.userOpHash)
        log.info('waitForTransactionReceiptActivity', { receipt })
        return receipt
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        log.error('Error in waitForTransactionReceiptActivity', { hash, error: errorMessage })
        throw ApplicationFailure.nonRetryable('Error waiting for tx receipt', errorMessage)
      }
    },
    async isTransferIndexedActivity(hash: `0x${string}`) {
      const isIndexed = await isTransferIndexed(hash)
      log.info('isTransferIndexedActivity', { isIndexed })
      if (!isIndexed) {
        throw ApplicationFailure.retryable('Transfer not yet indexed in db')
      }
      return isIndexed
    },
  }
}
