import { log, ApplicationFailure } from '@temporalio/activity'
import { isTransferIndexed } from './supabase'
import { simulateUserOperation, sendUserOperation, waitForTransactionReceipt } from './wagmi'
import type { UserOperation } from 'permissionless'
import { bootstrap } from '@my/workflows/utils'

export const createTransferActivities = (env: Record<string, string | undefined>) => {
  bootstrap(env)

  return {
    simulateUserOpActivity,
    sendUserOpActivity,
    waitForTransactionReceiptActivity,
    isTransferIndexedActivity,
  }
}
async function simulateUserOpActivity(userOp: UserOperation<'v0.7'>) {
  if (!userOp.signature) {
    throw ApplicationFailure.nonRetryable('UserOp signature is required')
  }
  try {
    await simulateUserOperation(userOp)
  } catch (error) {
    throw ApplicationFailure.nonRetryable('Error simulating user operation', error.code, error)
  }
}

async function sendUserOpActivity(userOp: UserOperation<'v0.7'>) {
  const creationTime = Date.now()

  try {
    const hash = await sendUserOperation(userOp)
    log.info('UserOperation sent', {
      hash,
      sendTime: Date.now(),
      userOp: JSON.stringify(userOp, null, 2),
    })
    return hash
  } catch (error) {
    const errorMessage =
      error instanceof Error ? `${error.name}: ${error.message}` : 'Unknown error occurred'

    log.error('Error in sendUserOpActivity', {
      error: errorMessage,
      creationTime,
      sendTime: Date.now(),
      userOp: JSON.stringify(userOp, null, 2),
    })

    throw ApplicationFailure.nonRetryable(errorMessage)
  }
}

async function waitForTransactionReceiptActivity(hash: `0x${string}`) {
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
}
async function isTransferIndexedActivity(hash: `0x${string}`) {
  const isIndexed = await isTransferIndexed(hash)
  log.info('isTransferIndexedActivity', { isIndexed })
  if (!isIndexed) {
    throw ApplicationFailure.retryable('Transfer not yet indexed in db')
  }
  return isIndexed
}
