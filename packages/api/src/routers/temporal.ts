import { getTemporalClient } from '@my/temporal/client'
import { baseMainnetBundlerClient, baseMainnetClient, entryPointAddress } from '@my/wagmi'
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
import { withRetry } from 'viem'
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

        log(`Workflow Created: ${workflowId}`)

        await withRetry(
          async () => {
            const [initialized, receipt] = await Promise.allSettled([
              lookupIntializedWorkflow(workflowId)
                .then(() => true)
                .catch(() => false),
              (async () => {
                // maybe bundler already has the receipt
                const receipt = await baseMainnetBundlerClient.getUserOperationReceipt({
                  hash: userOpHash,
                })
                if (!receipt) return null
                const supabase = createSupabaseAdminClient()
                // do not redirect unless it's been indexed into send_account_transfers
                const { data, error } = await supabase
                  .from('send_account_transfers')
                  .select('*')
                  .eq('tx_hash', hexToBytea(receipt.receipt.transactionHash))
                  .maybeSingle()
                throwIf(error)
                return data
              })(),
            ] as const)

            if (initialized.status === 'fulfilled' && initialized.value) {
              log('transfer initialized')
              return true
            }

            if (receipt.status === 'fulfilled' && receipt.value) {
              log('userop already onchain', receipt.value.tx_hash)
              return true
            }

            throw new TRPCError({
              code: 'PRECONDITION_FAILED',
              message: 'Transfer not yet submitted',
            })
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
              if (error.code === 'PGRST116' || error.message === 'Transfer not yet submitted') {
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

async function lookupIntializedWorkflow(workflowId: string): Promise<{ status: string }> {
  // check if the transfer is initialized
  const supabaseAdmin = createSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('activity')
    .select('data->>status')
    .eq('event_id', workflowId)
    .eq('event_name', 'temporal_send_account_transfers')
    .single()
  throwIf(error)
  assert(!!data && data.status !== 'initialized', 'Transfer not yet submitted')
  return data
}
