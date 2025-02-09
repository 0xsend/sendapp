import { log, ApplicationFailure } from '@temporalio/activity'
import {
  isTokenTransferIndexed,
  isEthTransferIndexed,
  insertTemporalTokenSendAccountTransfer,
  updateTemporalSendAccountTransfer,
  insertTemporalEthSendAccountTransfer,
  deleteTemporalTransferFromActivityTable,
} from './supabase'
import { simulateUserOperation, sendUserOperation, waitForTransactionReceipt } from './wagmi'
import type { UserOperation } from 'permissionless'
import { bootstrap } from '@my/workflows/utils'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { allCoinsDict } from 'app/data/coins'

export const createTransferActivities = (env: Record<string, string | undefined>) => {
  bootstrap(env)

  return {
    async initializeTransferActivity(workflowId: string, userOp: UserOperation<'v0.7'>) {
      const { from, to, token, amount } = decodeTransferUserOp({ userOp })
      if (!from || !to || !amount || !token) {
        throw ApplicationFailure.nonRetryable('User Operation is not a valid transfer')
      }
      if (amount <= 0n) {
        throw ApplicationFailure.nonRetryable('User Operation has amount <= 0')
      }

      if (!userOp.signature) {
        throw ApplicationFailure.nonRetryable('UserOp signature is required')
      }
      try {
        await simulateUserOperation(userOp)
      } catch (error) {
        throw ApplicationFailure.nonRetryable('Error simulating user operation', error.code, error)
      }

      // Convert hex addresses to bytea for database
      const fromBytea = hexToBytea(from)
      const toBytea = hexToBytea(to)
      const { error } =
        token === 'eth'
          ? await insertTemporalEthSendAccountTransfer({
              workflow_id: workflowId,
              status: 'initialized',
              sender: fromBytea,
              value: amount,
              log_addr: toBytea,
            })
          : await insertTemporalTokenSendAccountTransfer({
              workflow_id: workflowId,
              status: 'initialized',
              f: fromBytea,
              t: toBytea,
              v: amount,
              log_addr: hexToBytea(token),
            })

      if (error) {
        throw ApplicationFailure.nonRetryable(
          'Error inserting transfer into temporal.send_account_transfers',
          error.code,
          {
            error,
            workflowId,
          }
        )
      }

      return { from, to, amount, token }
    },
    async sendUserOpActivity(userOp: UserOperation<'v0.7'>) {
      try {
        const hash = await sendUserOperation(userOp)
        log.info('UserOperation sent successfully', { hash })
        return hash
      } catch (error) {
        log.error('Error sending user operation', { error })
        throw ApplicationFailure.nonRetryable('Error sending user operation', error.code)
      }
    },
    async updateTemporalTransferSentStatusActivity(workflowId: string, hash: `0x${string}`) {
      const { error } = await updateTemporalSendAccountTransfer({
        workflow_id: workflowId,
        status: 'sent',
        data: { user_op_hash: hash },
      })
      if (error) {
        throw ApplicationFailure.retryable(
          'Error updating entry in temporal_send_account_transfers with sent status',
          error.code,
          {
            error,
            workflowId,
          }
        )
      }
      return null
    },
    async waitForTransactionReceiptActivity(workflowId: string, hash: `0x${string}`) {
      try {
        const res = await waitForTransactionReceipt(hash)
        if (!res) {
          throw ApplicationFailure.retryable('No receipt returned from waitForTransactionReceipt')
        }
        if (!res.success) {
          throw ApplicationFailure.nonRetryable('Tx failed', res.sender, res.userOpHash)
        }
        log.info('waitForTransactionReceiptActivity', { tx_hash: res.receipt.transactionHash })
        const { receipt } = res

        await updateTemporalSendAccountTransfer({
          workflow_id: workflowId,
          status: 'confirmed',
          data: {
            tx_hash: receipt.transactionHash,
            block_num: receipt.blockNumber.toString(),
          },
        })
        return receipt
      } catch (error) {
        throw ApplicationFailure.retryable('Error waiting for tx receipt', error.code, error)
      }
    },
    async isTransferIndexedActivity(
      workflowId: string,
      tx_hash: `0x${string}`,
      token: keyof allCoinsDict
    ) {
      const isIndexed =
        token === 'eth'
          ? await isEthTransferIndexed(tx_hash)
          : await isTokenTransferIndexed(tx_hash)

      if (!isIndexed) {
        throw ApplicationFailure.retryable('Transfer not indexed in db')
      }
      const { error } = await updateTemporalSendAccountTransfer({
        workflow_id: workflowId,
        status: 'indexed',
      })
      if (error) {
        throw ApplicationFailure.retryable(
          'Error updating entry in temporal_send_account_transfers with indexed status',
          error.code,
          {
            error,
            workflowId,
          }
        )
      }
      log.info('isTransferIndexedActivity', { isIndexed })
      return isIndexed
    },
    async deleteTemporalTransferActivity(workflowId: string) {
      const { error } = await deleteTemporalTransferFromActivityTable(workflowId)
      if (error) {
        throw ApplicationFailure.retryable(
          'Error deleting temporal_tranfer entry in activity',
          error.code,
          {
            error,
            workflowId,
          }
        )
      }
    },
  }
}
