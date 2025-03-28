import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import type { UserOperation } from 'permissionless'
import { TransferWorkflow } from '@my/workflows/all-workflows'
import { baseMainnetClient, entryPointAddress } from '@my/wagmi'
import { getUserOperationHash } from 'permissionless/utils'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { getTemporalClient } from '@my/temporal/client'
import { withRetry } from 'viem'
import type { PostgrestError } from '@supabase/supabase-js'
import { throwIf } from 'app/utils/throwIf'
import { assert } from 'app/utils/assert'

const log = debug('api:temporal')

export const temporalRouter = createTRPCRouter({
  transfer: protectedProcedure
    .input(
      z.object({
        userOp: z.custom<UserOperation<'v0.7'>>(),
      })
    )
    .mutation(
      async ({
        input: { userOp },
        ctx: {
          session: { user },
        },
      }) => {
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

        const { workflowId } = await client.workflow
          .start(TransferWorkflow, {
            taskQueue: 'monorepo',
            workflowId: `temporal/transfer/${user.id}/${userOpHash}`,
            args: [userOp],
          })
          .catch((e) => {
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
            const { data, error } = await supabaseAdmin
              .schema('temporal')
              .from('send_account_transfers')
              .select('status')
              .eq('workflow_id', workflowId)
              .single()
            throwIf(error)
            assert(data?.status !== 'initialized', 'Transfer not yet submitted')
            return data
          },
          {
            retryCount: 10,
            delay: 500,
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
