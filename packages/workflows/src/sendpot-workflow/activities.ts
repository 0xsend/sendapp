import { ApplicationFailure, log } from '@temporalio/activity'
import { bootstrap } from '../utils'
import {
  decodeApproveTokenCallData,
  decodePurchaseTicketsCallData,
} from 'app/utils/decode-calldata'
import {
  upsertTemporalSendPotTicketPurchases,
  updateTemporalSendPotTicketPurchases,
  type TemporalTicketPurchase,
  type TemporalTicketPurchaseInsert,
  type TemporalTicketPurchaseUpdate,
} from './supabase'
import { isRetryableDBError } from '../shared/supabase'
import { type UserOpActivities, createUserOpActivities } from '../shared/userop-activities'
import type { Hex } from 'viem'

type PurchaseTicketsActivities = {
  upsertTemporalSendPotTicketPurchasesActivity: (
    TemporalTicketPurchaseInsert
  ) => Promise<TemporalTicketPurchase>
  decodeApproveTokenCallDataActivity: (data: Hex) => Promise<{
    [K in keyof ReturnType<typeof decodeApproveTokenCallData>]: NonNullable<
      ReturnType<typeof decodeApproveTokenCallData>[K]
    >
  }>
  decodePurchaseTicketsCallDataActivity: (data: Hex) => Promise<{
    [K in keyof ReturnType<typeof decodePurchaseTicketsCallData>]: NonNullable<
      ReturnType<typeof decodePurchaseTicketsCallData>[K]
    >
  }>
  updateTemporalSendPotTicketPurchasesActivity: (
    TemporalTicketPurchaseUpdate
  ) => Promise<TemporalTicketPurchase>
}

export const createSendPotPurchaseTicketsActivities = (
  env: Record<string, string | undefined>
): PurchaseTicketsActivities & UserOpActivities => {
  bootstrap(env)

  const userOpActivities = createUserOpActivities(env)

  return {
    ...userOpActivities,
    async upsertTemporalSendPotTicketPurchasesActivity({ workflowId, data }) {
      const { data: upsertData, error } = await upsertTemporalSendPotTicketPurchases({
        workflow_id: workflowId,
        status: 'initialized',
        data,
      })

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
            workflowId,
          })
        }

        const { error: upsertFailedError } = await upsertTemporalSendPotTicketPurchases({
          workflow_id: workflowId,
          status: 'failed',
        })
        if (upsertFailedError) {
          throw ApplicationFailure.retryable(
            'Error upserting failed transfer from temporal.send_account_transfers',
            upsertFailedError.code,
            {
              error: upsertFailedError,
              workflowId,
            }
          )
        }
        throw ApplicationFailure.nonRetryable('Database error occurred', error.code, {
          error,
          workflowId,
        })
      }

      return upsertData
    },
    async decodeApproveTokenCallDataActivity(data) {
      const { spender, value, functionName } = decodeApproveTokenCallData(data)
      if (!spender || !value || !functionName) {
        log.error('Failed to decode approve token user op', { spender, value, functionName })
        throw new Error('Failed to decode approve token user op')
      }
      if (value <= 0n) {
        log.error('User Operation has value < 0', { value })
        throw new Error('User Operation has value < 0')
      }

      return { functionName, spender, value }
    },
    async decodePurchaseTicketsCallDataActivity(data) {
      const { functionName, recipient, referrer, value, buyer } =
        decodePurchaseTicketsCallData(data)
      if (!functionName || !recipient || !referrer || !value || !buyer) {
        log.error('Failed to decode puchaseTicket user op', { recipient, referrer, value, buyer })
        throw new Error('User Operation is not a valid purchaseTicket')
      }
      if (value <= 0n) {
        log.error('User Operation has value < 0', { value })
        throw new Error('User Operation has value < 0')
      }

      return { functionName, referrer, value, recipient, buyer }
    },
    async updateTemporalSendPotTicketPurchasesActivity({
      workflowId,
      status,
      createdAtBlockNum,
      data,
    }) {
      const { data: upsertedData, error } = await updateTemporalSendPotTicketPurchases({
        workflow_id: workflowId,
        status,
        created_at_block_num: createdAtBlockNum ? Number(createdAtBlockNum) : null,
        data,
      })

      if (error) {
        if (isRetryableDBError(error)) {
          throw ApplicationFailure.retryable('Database connection error, retrying...', error.code, {
            error,
            workflowId,
          })
        }

        const { error: updateError } = await updateTemporalSendPotTicketPurchases({
          workflow_id: workflowId,
          status: 'failed',
        })
        if (updateError) {
          throw ApplicationFailure.retryable(
            'Error updating transaction status to failed from temporal.send_pot_ticket_purchases',
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

      return upsertedData
    },
  }
}
