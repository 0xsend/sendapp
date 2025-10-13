import { getTemporalClient } from '@my/temporal/client'
import { sendBaseMainnetBundlerClient, baseMainnetClient, entryPointAddress } from '@my/wagmi'
import { startWorkflow } from '@my/workflows/utils'
import type { PostgrestError } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import { formFields } from 'app/utils/SchemaForm'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { throwIf } from 'app/utils/throwIf'
import debug from 'debug'
import type { UserOperation } from 'permissionless'
import { getUserOperationHash } from 'permissionless/utils'
import { type Hex, withRetry } from 'viem'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'

const log = debug('api:temporal')

export const temporalRouter = createTRPCRouter({
  transfer: protectedProcedure
    .input(
      z.object({
        userOp: z.custom<UserOperation<'v0.7'>>(),
        note: z.string().optional(),
      })
    )
    .mutation(
      async ({
        input: { userOp, note },
        ctx: {
          session: { user },
        },
      }) => {
        const startTime = new Date(Date.now())

        const noteValidationError = note
          ? formFields.note.safeParse(decodeURIComponent(note)).error
          : null
        assert(!noteValidationError, 'Note failed to match validation constraints')
        const client = await getTemporalClient().catch((e) => {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: e.message,
          })
        })

        const chainId = baseMainnetClient.chain.id
        const entryPoint = entryPointAddress[chainId]
        const userOpHash = getUserOperationHash({
          userOperation: userOp,
          entryPoint,
          chainId,
        })
        await baseMainnetClient
          .call({
            account: entryPointAddress[baseMainnetClient.chain.id],
            to: userOp.sender,
            data: userOp.callData,
          })
          .catch((e) => {
            throw new TRPCError({
              code: 'PRECONDITION_FAILED',
              message: e.message,
            })
          })

        const { workflowId } = await startWorkflow({
          client,
          workflow: 'transfer',
          ids: [user.id, userOpHash],
          args: [userOp, note],
        }).catch((e) => {
          log('Error starting transfer workflow', { error: e.message })
          if (e.message.includes('Workflow already exists')) {
            throw new TRPCError({
              code: 'PRECONDITION_FAILED',
              message: e.message,
            })
          }
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: e.message,
          })
        })
        await withRetry(
          async () => {
            const initPromise = lookupInitializedWorkflow(workflowId, startTime).catch((e) => {
              log(e)
              return Promise.reject()
            })

            const receiptPromise = lookupTransferReceipt(userOpHash, startTime).catch((e) => {
              log(e)
              return Promise.reject()
            })

            try {
              return await Promise.any([initPromise, receiptPromise])
            } catch (error) {
              throw new TRPCError({
                code: 'PRECONDITION_FAILED',
                message:
                  'Pending transfer not found: Please manually verify whether the send was completed.',
              })
            }
          },
          {
            retryCount: 20,
            delay: ({ count, error }) => {
              const backoff = 500 + Math.random() * 100 // add some randomness to the backoff
              log(`Waiting for transfer to start count=${count} backoff=${backoff}`, error)
              return Math.min(backoff, 3000) // cap backoff at 3 seconds
            },
            shouldRetry({ error: e }) {
              const error = e as unknown as PostgrestError
              if (error.code === 'PGRST116' || error.code === 'PRECONDITION_FAILED') {
                return true // retry on no rows
              }
              return false
            },
          }
        )

        return { workflowId }
      }
    ),
})

async function lookupTransferReceipt(userOpHash: Hex, startTime: Date): Promise<boolean> {
  const blockTimeWindow = Math.floor(startTime.getTime() / 1000) - 5 * 60 // subtract 5 minutes as a buffer window
  const receipt = await sendBaseMainnetBundlerClient.getUserOperationReceipt({
    hash: userOpHash,
  })
  assert(!!receipt, 'Transfer not onchain')

  const supabase = createSupabaseAdminClient()
  const { count, error } = await supabase
    .from('send_account_transfers')
    .select('*', { count: 'exact', head: true })
    .eq('tx_hash', hexToBytea(receipt.receipt.transactionHash))
    .gte('block_time', blockTimeWindow)

  throwIf(error)
  assert(count !== null && count > 0, 'Transfer not indexed')
  log('userop already onchain', receipt.receipt.transactionHash)
  return true
}

async function lookupInitializedWorkflow(workflowId: string, startTime: Date): Promise<boolean> {
  const supabaseAdmin = createSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('activity')
    .select('data->>status')
    .eq('event_id', workflowId)
    .eq('event_name', 'temporal_send_account_transfers')
    .gte('created_at', startTime.toISOString())
    .single()

  throwIf(error)
  assert(!!data && data.status !== 'initialized', 'Transfer not yet submitted')
  log(`${data.status} transfer found: ${workflowId}`)
  return true
}
