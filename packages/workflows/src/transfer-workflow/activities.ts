import { log, ApplicationFailure } from '@temporalio/activity'
import { fetchTransfer } from './supabase'
import {
  simulateUserOperation,
  sendUserOperation,
  waitForTransactionReceipt,
  generateTransferUserOp,
} from './wagmi'
import type { TransferWorkflowArgs } from './workflow'
import { isAddress, type Hex } from 'viem'
export function createTransferActivities(supabaseUrl: string, supabaseKey: string) {
  globalThis.process = globalThis.process || {}
  globalThis.process.env.SUPABASE_URL = supabaseUrl // HACK: set the supabase url in the environment
  globalThis.process.env.SUPABASE_SERVICE_ROLE = supabaseKey // HACK: set the supabase key in the environment

  return {
    sendUserOpActivity,
    fetchTransferActivity,
    waitForTransactionReceiptActivity,
  }
}

async function sendUserOpActivity(args: TransferWorkflowArgs) {
  const { sender, to, token, amount, nonce } = args
  const parsedAmount = BigInt(amount)
  const parsedNonce = BigInt(nonce)
  if (!!sender && !isAddress(sender))
    throw ApplicationFailure.nonRetryable('Invalid send account address')
  if (!!to && !isAddress(to)) throw ApplicationFailure.nonRetryable('Invalid to address')
  if (!token || !isAddress(token)) throw ApplicationFailure.nonRetryable('Invalid token address')
  if (typeof parsedAmount !== 'bigint' || parsedAmount <= 0n)
    throw ApplicationFailure.nonRetryable('Invalid amount')
  if (typeof parsedNonce !== 'bigint' || parsedNonce < 0n)
    throw ApplicationFailure.nonRetryable('Invalid nonce')
  try {
    const userOp = await generateTransferUserOp({
      sender,
      to,
      token,
      amount: parsedAmount,
      nonce: parsedNonce,
    })
    userOp.signature = args.signature
    console.log('userOp: ', userOp)

    const hash = await sendUserOperation(userOp)
    console.log('hash: ', hash)
    log.info('sendUserOperationActivity', { hash, userOp })
    return hash
  } catch (error) {
    throw ApplicationFailure.nonRetryable('Error sending user operation', error.code, error)
  }
}

async function waitForTransactionReceiptActivity(hash: `0x${string}`) {
  try {
    const receipt = await waitForTransactionReceipt(hash)
    if (!receipt.success)
      throw ApplicationFailure.nonRetryable('Tx failed', receipt.sender, receipt.userOpHash)
    log.info('waitForTransactionReceiptActivity', { receipt })
    return receipt
  } catch (error) {
    throw ApplicationFailure.nonRetryable('Error waiting for tx receipt', error.code, error)
  }
}

async function fetchTransferActivity(hash: `0x${string}`) {
  const { data: transfer, error } = await fetchTransfer(hash)
  if (error) {
    if (error.code === 'PGRST116') {
      log.info('fetchTransferActivity', { error })
      return null
    }
    throw ApplicationFailure.nonRetryable(
      'Error fetching transfer from activity column.',
      error.code,
      error
    )
  }
  log.info('fetchTransferActivity', { transfer })
  return transfer
}
