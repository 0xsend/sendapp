import { bootstrap, isRetryableDBError } from '@my/workflows/utils'
import { Context as ActivityContext, ApplicationFailure, log, sleep } from '@temporalio/activity'
import { allCoins } from 'app/data/coins'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import type { GetUserOperationReceiptReturnType, UserOperation } from 'permissionless'
import type { Address, Hex } from 'viem'
import {
  updateTemporalSendAccountTransfer,
  upsertTemporalSendAccountTransfer,
  type TemporalTransfer,
  type TemporalTransferInsert,
  type TemporalTransferUpdate,
} from './supabase'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { hexToBytea } from 'app/utils/hexToBytea'
import type { Database } from '@my/supabase/database-generated.types'
import { findLogIndex, isAddressInTopic, isReceiveTopic } from './wagmi'
import { baseMainnetClient } from '@my/wagmi'

export type IndexedTransfer =
  | Database['public']['Tables']['send_account_receives']['Row']
  | Database['public']['Tables']['send_account_transfers']['Row']

type Activity = Database['public']['Tables']['activity']['Row']
type ActivityInsert = Database['public']['Tables']['activity']['Insert']

type ReceivesInsert = {
  block_num: bigint
  tx_idx: bigint
  log_idx: bigint
  value: bigint
  block_time: bigint
} & Omit<
  Database['public']['Tables']['send_account_receives']['Insert'],
  'block_num' | 'tx_idx' | 'log_idx' | 'value' | 'block_time'
>

type TransferActivities = {
  upsertTemporalSendAccountTransferActivity: (
    params: TemporalTransferInsert
  ) => Promise<TemporalTransfer>
  decodeTransferUserOpActivity: (
    workflowId: string,
    userOp: UserOperation<'v0.7'>
  ) => Promise<{
    from: Address
    to: Address
    amount: bigint
    token: Address | null
  }>
  getUserIdByAddressActivity: (params: {
    workflowId: string
    addresses: [sender: Address, recipient: Address]
  }) => Promise<[fromUserId: string, toUserId: string | null]>
  updateTemporalSendAccountTransferActivity: (
    params: TemporalTransferUpdate
  ) => Promise<TemporalTransfer>
  getPreviousIndexedBlockNum: (params: {
    workflowId: string
    token: Address | null
  }) => Promise<bigint>
  insertTransferEventActivity: (params: {
    workflowId: string
    senderUserId: string
    recipientUserId: string | null
    bundlerReceipt: GetUserOperationReceiptReturnType
    note?: string
    token: Address | null
    sender: Address
    recipient: Address
    amount: bigint
    blockTime: bigint
  }) => Promise<Activity>
  insertEthTransferActivity: (params: {
    bundlerReceipt: GetUserOperationReceiptReturnType
    sender: Address
    recipient: Address
    amount: bigint
    blockTime: bigint
  }) => Promise<IndexedTransfer>
  verifyTransferIndexedActivity: (params: {
    bundlerReceipt: GetUserOperationReceiptReturnType
    token: Address | null
    sender: Address
    recipient: Address
  }) => Promise<boolean>
}
export const createTransferActivities = (
  env: Record<string, string | undefined>
): TransferActivities => {
  bootstrap(env)

  return {
    async upsertTemporalSendAccountTransferActivity(params) {
      const { workflow_id } = params
      const { data: upsertData, error } = await upsertTemporalSendAccountTransfer({
        ...params,
        status: 'initialized',
      })

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
            workflow_id,
          })
        }

        const { error: upsertFailedError } = await upsertTemporalSendAccountTransfer({
          workflow_id,
          status: 'failed',
        })
        if (upsertFailedError) {
          throw ApplicationFailure.retryable(
            'Error upserting failed transfer from temporal.send_account_transfers',
            upsertFailedError.code,
            {
              error: upsertFailedError,
              workflow_id,
            }
          )
        }
        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
          workflow_id,
        })
      }

      return upsertData
    },
    async decodeTransferUserOpActivity(workflowId, userOp) {
      try {
        const { from, to, token, amount } = decodeTransferUserOp({ userOp })
        if (!from || !to || !amount || !token) {
          log.error('Failed to decode transfer user op', { from, to, amount, token })
          throw new Error('User Operation is not a valid transfer')
        }
        if (!allCoins.find((c) => c.token === token)) {
          log.error('Token ${token} is not a supported', { token })
          throw new Error(`Token ${token} is not a supported`)
        }
        if (amount < 0n) {
          log.error('User Operation has amount < 0', { amount })
          throw new Error('User Operation has amount < 0')
        }
        if (!userOp.signature) {
          log.error('UserOp signature is required')
          throw new Error('UserOp signature is required')
        }

        return { from, to, amount, token: token === 'eth' ? null : token }
      } catch (error) {
        log.error('decodeTransferUserOpActivity failed', { error })
        const { error: updateError } = await updateTemporalSendAccountTransfer({
          workflow_id: workflowId,
          status: 'failed',
        })
        if (updateError) {
          throw ApplicationFailure.retryable(
            'Error updating transfer status to failed from temporal.send_account_transfers',
            updateError.code,
            {
              error: updateError,
              workflowId,
            }
          )
        }
        log.error('Error decoding user operation:', {
          code: error.code,
          name: error.name,
          message: error.message,
        })
        throw ApplicationFailure.nonRetryable(
          'Error decoding user operation',
          error.code,
          error.name,
          error.message
        )
      }
    },
    async updateTemporalSendAccountTransferActivity(params) {
      const { workflow_id } = params
      const { data: upsertedData, error } = await updateTemporalSendAccountTransfer(params)

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
            workflow_id,
          })
        }

        const { error: updateError } = await updateTemporalSendAccountTransfer({
          workflow_id,
          status: 'failed',
        })
        if (updateError) {
          throw ApplicationFailure.retryable(
            'Error updating transfer status to failed from temporal.send_account_transfers',
            updateError.code,
            {
              error: updateError,
              workflow_id,
            }
          )
        }

        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
          workflow_id,
        })
      }

      return upsertedData
    },
    async insertTransferEventActivity({
      bundlerReceipt,
      workflowId,
      senderUserId,
      recipientUserId,
      token,
      sender,
      recipient,
      amount,
      blockTime,
      note,
    }) {
      const supabaseAdmin = createSupabaseAdminClient()
      const block_num = bundlerReceipt.receipt.blockNumber.toString()
      const tx_idx = bundlerReceipt.receipt.transactionIndex.toString()
      const tx_hash = hexToBytea(bundlerReceipt.receipt.transactionHash)
      const block_time = (blockTime * 1000n).toString()
      const log_idx = findLogIndex({
        logs: bundlerReceipt.logs,
        sender: sender,
        recipient: recipient,
        token,
      })?.toString()

      if (log_idx === undefined) {
        throw ApplicationFailure.nonRetryable(
          'Transaction receipt does not contain a log of the transfer'
        )
      }

      const event_name = token ? 'send_account_transfers' : 'send_account_receives'
      const event_id = `${event_name}/base_logs/${block_num}/${tx_idx}/${log_idx}`

      const event: ActivityInsert = {
        event_name,
        event_id,
        from_user_id: senderUserId,
        to_user_id: recipientUserId,
        created_at: new Date(block_time).toISOString(),
        data: token
          ? {
              f: hexToBytea(sender),
              t: hexToBytea(recipient),
              v: amount.toString(),
              log_addr: hexToBytea(token),
              block_num,
              tx_idx,
              log_idx,
              tx_hash,
              workflow_id: workflowId,
              note,
            }
          : {
              sender: hexToBytea(sender),
              value: amount.toString(),
              log_addr: hexToBytea(recipient),
              block_num,
              tx_idx,
              log_idx,
              tx_hash,
              workflow_id: workflowId,
              note,
            },
      }

      const { data, error } = await supabaseAdmin
        .schema('public')
        .from('activity')
        .upsert(event, {
          onConflict: 'event_name,event_id',
          ignoreDuplicates: false,
        })
        .select('*')
        .single()

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
            workflowId,
          })
        }

        const { error: updateError } = await updateTemporalSendAccountTransfer({
          workflow_id: workflowId,
          status: 'failed',
        })
        if (updateError) {
          throw ApplicationFailure.retryable(
            'Error updating transfer status to failed from temporal.send_account_transfers',
            updateError.code,
            {
              error: updateError,
              workflowId,
            }
          )
        }

        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
          workflowId,
        })
      }

      return data
    },
    async getPreviousIndexedBlockNum({ workflowId, token }) {
      const supabaseAdmin = createSupabaseAdminClient()

      const { data, error } = token
        ? await supabaseAdmin
            .from('send_account_transfers')
            .select('block_num')
            .eq('log_addr', hexToBytea(token))
            .order('block_num', { ascending: false })
            .limit(1)
            .maybeSingle()
        : await supabaseAdmin
            .from('send_account_receives')
            .select('block_num')
            .order('block_num', { ascending: false })
            .limit(1)
            .maybeSingle()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found. start from 0
          return 0n
        }
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
          })
        }

        const { error: updateError } = await updateTemporalSendAccountTransfer({
          workflow_id: workflowId,
          status: 'failed',
        })
        if (updateError) {
          throw ApplicationFailure.retryable(
            'Error updating transfer status to failed from temporal.send_account_transfers',
            updateError.code,
            {
              error: updateError,
            }
          )
        }
        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
        })
      }
      return BigInt(data?.block_num ?? 0)
    },
    async getUserIdByAddressActivity({ workflowId, addresses }) {
      const supabaseAdmin = createSupabaseAdminClient()
      const { data, error } = await supabaseAdmin
        .from('send_accounts')
        .select('user_id, address')
        .in('address', addresses)

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
          })
        }

        const { error: updateError } = await updateTemporalSendAccountTransfer({
          workflow_id: workflowId,
          status: 'failed',
        })
        if (updateError) {
          throw ApplicationFailure.retryable(
            'Error updating transfer status to failed from temporal.send_account_transfers',
            updateError.code,
            {
              error: updateError,
            }
          )
        }

        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
        })
      }
      const senderUserId = data.find((d) => d.address === addresses[0])?.user_id
      const recipientUserId = data.find((d) => d.address === addresses[1])?.user_id ?? null
      if (!senderUserId) {
        throw ApplicationFailure.nonRetryable(
          'Failed to find userId for sender',
          'SENDER_USER_ID_NOT_FOUND',
          { addresses }
        )
      }
      return [senderUserId, recipientUserId]
    },
    async insertEthTransferActivity({ bundlerReceipt, recipient, sender, amount, blockTime }) {
      const supabaseAdmin = createSupabaseAdminClient()
      const { blockNumber: block_num, transactionIndex: tx_idx } = bundlerReceipt.receipt
      const ig_name = 'send_account_receives'
      const src_name = 'base_logs'

      const log_idx = findLogIndex({
        logs: bundlerReceipt.logs,
        sender,
        recipient,
        token: null,
      })

      if (log_idx === undefined) {
        throw ApplicationFailure.nonRetryable(
          'Transaction receipt does not contain a log of the transfer'
        )
      }
      const event_id = `send_account_receives/base_logs/${block_num}/${tx_idx}/${log_idx}`

      const ethWithdrawal: ReceivesInsert = {
        event_id,
        chain_id: baseMainnetClient.chain.id,
        block_num: block_num,
        tx_idx: tx_idx,
        log_idx: log_idx,
        log_addr: hexToBytea(recipient),
        sender: hexToBytea(sender),
        value: amount,
        block_time: blockTime,
        tx_hash: hexToBytea(bundlerReceipt.receipt.transactionHash),
        ig_name,
        src_name,
        abi_idx: 0,
      }
      const { data, error } = await supabaseAdmin
        .from('send_account_receives')
        // @ts-expect-error Supabase types won't accept bigint but its fine
        .insert(ethWithdrawal) // Efficiently check existence
        .select('*')
        .single()
      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
          })
        }
        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
        })
      }
      return data
    },
    async verifyTransferIndexedActivity({ bundlerReceipt, token, sender, recipient }) {
      const maxAttempts = 10
      const initialDelayMs = 1000
      const backoffCoefficient = 2

      const block_num_bigint = bundlerReceipt.receipt.blockNumber
      const tx_idx_bigint = bundlerReceipt.receipt.transactionIndex
      const log_idx = findLogIndex({
        logs: bundlerReceipt.logs,
        sender,
        recipient,
        token,
      })

      if (log_idx === undefined) {
        throw ApplicationFailure.nonRetryable(
          'Transaction receipt does not contain a log of the transfer',
          'LOG_INDEX_NOT_FOUND',
          { sender, recipient, token, txHash: bundlerReceipt.receipt.transactionHash }
        )
      }

      const tableName = token ? 'send_account_transfers' : 'send_account_receives'
      const supabaseAdmin = createSupabaseAdminClient()

      const senderBytea = hexToBytea(sender)
      const recipientBytea = hexToBytea(recipient)
      const tokenBytea = token ? hexToBytea(token) : null

      // For logging and error messages, use string versions
      const block_num_str = block_num_bigint.toString()
      const tx_idx_str = tx_idx_bigint.toString()
      const log_idx_str = log_idx.toString()

      log.info('Starting verification for indexed transfer', {
        tableName,
        block_num: block_num_str,
        tx_idx: tx_idx_str,
        log_idx: log_idx_str,
        token,
        sender,
        recipient,
      })

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        ActivityContext.current().heartbeat(`Attempt ${attempt}/${maxAttempts}`)

        try {
          let query = supabaseAdmin
            .from(tableName)
            .select('id', { count: 'exact', head: true })
            // All columns are numbers according to generated types
            .eq('block_num', Number(block_num_str))
            .eq('tx_idx', Number(tx_idx_bigint))
            .eq('log_idx', Number(log_idx))

          if (token && tokenBytea) {
            query = query.eq('log_addr', tokenBytea).eq('f', senderBytea).eq('t', recipientBytea)
          } else {
            query = query.eq('sender', senderBytea).eq('log_addr', recipientBytea)
          }

          const { error, count } = await query

          if (error) {
            log.error('DB error checking transfer index', {
              tableName,
              block_num: block_num_str,
              tx_idx: tx_idx_str,
              log_idx: log_idx_str,
              token,
              sender,
              recipient,
              attempt,
              error,
            })
            if (isRetryableDBError(error)) {
              throw ApplicationFailure.retryable(
                `Retryable DB error on attempt ${attempt}`,
                error.code,
                { error }
              )
            }
            throw ApplicationFailure.nonRetryable(
              'Non-retryable DB error checking transfer index',
              error.code,
              { error }
            )
          }

          if (count !== null && count > 0) {
            log.info('Transfer successfully verified as indexed', {
              tableName,
              block_num: block_num_str,
              tx_idx: tx_idx_str,
              log_idx: log_idx_str,
              attempt,
            })
            return true
          }

          log.info(`Transfer not yet indexed, attempt ${attempt}/${maxAttempts}`, {
            tableName,
            block_num: block_num_str,
            tx_idx: tx_idx_str,
            log_idx: log_idx_str,
          })
        } catch (error) {
          log.error('Error during transfer verification attempt', {
            tableName,
            block_num: block_num_str,
            tx_idx: tx_idx_str,
            log_idx: log_idx_str,
            token,
            sender,
            recipient,
            attempt,
            error,
          })
          if (error instanceof ApplicationFailure) {
            throw error
          }
          throw ApplicationFailure.nonRetryable(
            error.message ?? `Unexpected error during verification attempt ${attempt}`,
            'TRANSFER_VERIFICATION_ATTEMPT_FAILED',
            { error }
          )
        }

        if (attempt < maxAttempts) {
          const delay = initialDelayMs * backoffCoefficient ** (attempt - 1)
          log.info(`Waiting ${delay}ms before next verification attempt`, {
            tableName,
            block_num: block_num_str,
            tx_idx: tx_idx_str,
            log_idx: log_idx_str,
          })
          await sleep(delay)
        }
      }

      log.error('Transfer indexing verification timed out after max attempts', {
        tableName,
        block_num: block_num_str,
        tx_idx: tx_idx_str,
        log_idx: log_idx_str,
        maxAttempts,
      })
      throw ApplicationFailure.nonRetryable(
        'Transfer indexing verification failed after maximum attempts',
        'TRANSFER_VERIFICATION_TIMEOUT',
        {
          tableName,
          block_num: block_num_str,
          tx_idx: tx_idx_str,
          log_idx: log_idx_str,
          maxAttempts,
        }
      )
    },
  }
}
