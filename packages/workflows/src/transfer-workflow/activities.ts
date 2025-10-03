import { bootstrap, isRetryableDBError } from '@my/workflows/utils'
import { ApplicationFailure, log } from '@temporalio/activity'
import { allCoins } from 'app/data/coins'
import { decodeTransferUserOp } from 'app/utils/decodeTransferUserOp'
import type { GetUserOperationReceiptReturnType, UserOperation } from 'permissionless'
import type { Address } from 'viem'
import {
  updateTemporalSendAccountTransfer,
  upsertTemporalSendAccountTransfer,
  type TemporalTransfer,
  type TemporalTransferInsert,
  type TemporalTransferUpdate,
} from './supabase'
import { isAddressInTopic, isReceiveTopic, isTransferTopic } from './wagmi'
import { config, readSendTokenBalanceOf, sendTokenAddress, baseMainnetClient } from '@my/wagmi'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { hexToBytea } from 'app/utils/hexToBytea'
import { getUserIdFromAddress } from '../deposit-workflow/supabase'
import type { Database } from '@my/supabase/database.types'

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
  updateTemporalSendAccountTransferActivity: (
    params: TemporalTransferUpdate
  ) => Promise<TemporalTransfer>
  getEventFromTransferActivity: ({
    bundlerReceipt,
    token,
    from,
    to,
  }: {
    bundlerReceipt: GetUserOperationReceiptReturnType
    token: Address | null
    from: Address
    to: Address
  }) => Promise<{
    eventName: string
    eventId: string
  }>
  readBalanceActivity: (params: {
    token: Address
    account: Address
  }) => Promise<{
    userId: string
    token: Address
    balance: string
    address: Address
    chainId: number
  } | null>
  persistBalanceActivity: (params: {
    userId: string
    token: Address | null
    balance: string | bigint
    address: Address
    chainId: number
  }) => Promise<void>
  upsertSendTokenHodlerVerificationActivity: (params: {
    userId: string
    balance: string | bigint
  }) => Promise<void>
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
    async getEventFromTransferActivity({ bundlerReceipt, token, from, to }) {
      const logs = bundlerReceipt.logs
      const block_num = bundlerReceipt.receipt.blockNumber.toString()
      const tx_idx = bundlerReceipt.receipt.transactionIndex.toString()

      const log_idx = token
        ? logs
            .find(
              ({ topics }) =>
                topics[0] &&
                topics[1] &&
                topics[2] &&
                isTransferTopic(topics[0]) &&
                isAddressInTopic(topics[1], from) &&
                isAddressInTopic(topics[2], to)
            )
            ?.logIndex.toString()
        : logs
            .find(
              ({ topics, address }) =>
                address.toLowerCase() === to.toLowerCase() &&
                topics[0] &&
                topics[1] &&
                isReceiveTopic(topics[0]) &&
                isAddressInTopic(topics[1], from)
            )
            ?.logIndex.toString()

      const eventName = token ? 'send_account_transfers' : 'send_account_receives'
      const eventId = `${eventName}/base_logs/${block_num}/${tx_idx}/${log_idx}`

      return {
        eventName,
        eventId,
      }
    },

    async readBalanceActivity({ token, account }) {
      try {
        // SEND-only gate
        const chainId = baseMainnetClient.chain.id
        const sendAddr = sendTokenAddress[chainId]
        if (!sendAddr || token.toLowerCase() !== sendAddr.toLowerCase()) {
          return null
        }

        // Resolve user_id via existing helper (send_accounts.address is CITEXT)
        const userId = await getUserIdFromAddress(account)
        if (!userId) return null

        // Read balanceOf
        const balance = await readSendTokenBalanceOf(config, {
          args: [account],
          chainId,
        })

        // Only return data; do not persist (simplicity)
        return {
          userId,
          token: sendAddr,
          balance: balance.toString(),
          address: account,
          chainId,
        }
      } catch (error) {
        if (error instanceof ApplicationFailure) throw error
        log.error('readBalanceActivity failed', { error })
        throw ApplicationFailure.nonRetryable('readBalanceActivity failed', 'READ_BALANCE_FAILED', {
          error,
        })
      }
    },

    async persistBalanceActivity({ userId, token, balance, address, chainId }) {
      try {
        const supabaseAdmin = createSupabaseAdminClient()
        const payload: Database['public']['Tables']['token_balances']['Insert'] = {
          user_id: userId,
          address: address,
          chain_id: chainId,
          token: token ? hexToBytea(token) : null,
          balance: balance,
          updated_at: new Date().toISOString(),
        }
        const { error } = await supabaseAdmin
          .from('token_balances')
          .upsert([payload], { onConflict: 'user_id,token_key' })

        if (error) {
          if (isRetryableDBError(error)) {
            throw ApplicationFailure.retryable(
              'Database connection error, retrying...',
              error.code,
              {
                error,
                userId,
              }
            )
          }
          throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
            error,
            userId,
          })
        }
      } catch (error) {
        if (error instanceof ApplicationFailure) throw error
        log.error('persistBalanceActivity failed', { error })
        throw ApplicationFailure.nonRetryable(
          error?.message ?? 'persistBalanceActivity failed',
          error?.code ?? 'PERSIST_BALANCE_FAILED',
          error
        )
      }
    },

    async upsertSendTokenHodlerVerificationActivity({ userId, balance }) {
      try {
        const supabaseAdmin = createSupabaseAdminClient()
        const nowIso = new Date().toISOString()

        // Resolve current distribution (qualification window contains now)
        const { data: distribution, error: distError } = await supabaseAdmin
          .from('distributions')
          .select('id, qualification_start, qualification_end')
          .lte('qualification_start', nowIso)
          .gte('qualification_end', nowIso)
          .order('qualification_start', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (distError) {
          if (isRetryableDBError(distError)) {
            throw ApplicationFailure.retryable(
              'Database connection error, retrying...',
              distError.code,
              {
                error: distError,
              }
            )
          }
          throw ApplicationFailure.nonRetryable(
            'Error fetching current distribution',
            distError.code,
            distError
          )
        }

        if (!distribution) {
          log.info('No active distribution window; skipping hodler verification upsert')
          return
        }

        // Insert or update without ON CONFLICT (index is not unique by design)
        const { data: existing, error: selectError } = await supabaseAdmin
          .from('distribution_verifications')
          .select('id')
          .eq('distribution_id', distribution.id)
          .eq('user_id', userId)
          .eq('type', 'send_token_hodler')
          .maybeSingle()

        if (selectError) {
          if (isRetryableDBError(selectError)) {
            throw ApplicationFailure.retryable(
              'Database connection error, retrying...',
              selectError.code,
              {
                error: selectError,
              }
            )
          }
          throw ApplicationFailure.nonRetryable(
            'Error selecting distribution_verifications',
            selectError.code,
            selectError
          )
        }

        let dvError: import('@supabase/supabase-js').PostgrestError | null = null
        if (existing && 'id' in existing && existing.id) {
          const { error: updateErr } = await supabaseAdmin
            .from('distribution_verifications')
            .update({ weight: balance, metadata: null })
            .eq('id', existing.id)
          dvError = updateErr
        } else {
          const { error: insertErr } = await supabaseAdmin
            .from('distribution_verifications')
            .insert([
              {
                distribution_id: distribution.id,
                user_id: userId,
                type: 'send_token_hodler',
                weight: balance,
                metadata: null,
              },
            ])
          dvError = insertErr
        }

        if (dvError) {
          if (isRetryableDBError(dvError)) {
            throw ApplicationFailure.retryable(
              'Database connection error, retrying...',
              dvError.code,
              {
                error: dvError,
                userId,
              }
            )
          }
          throw ApplicationFailure.nonRetryable('Database error occurred', dvError.code, {
            error: dvError,
            userId,
          })
        }
      } catch (error) {
        if (error instanceof ApplicationFailure) throw error
        log.error('upsertSendTokenHodlerVerificationActivity failed', { error })
        throw ApplicationFailure.nonRetryable(
          error?.message ?? 'upsertSendTokenHodlerVerificationActivity failed',
          error?.code ?? 'UPSERT_HODLER_VERIFICATION_FAILED',
          error
        )
      }
    },
  }
}
