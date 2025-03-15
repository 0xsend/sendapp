import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { getTemporalClient } from '@my/temporal/client'
import type { UserOperation } from 'permissionless'
import { TransferWorkflow } from '@my/workflows/all-workflows'
import { baseMainnetClient, entryPointAddress } from '@my/wagmi'
import { getUserOperationHash } from 'permissionless/utils'
import { supabaseAdmin } from 'app/utils/supabase/admin'

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
        try {
          const client = await getTemporalClient()
          const chainId = baseMainnetClient.chain.id
          const entryPoint = entryPointAddress[chainId]
          const userOpHash = getUserOperationHash({
            userOperation: userOp,
            entryPoint,
            chainId,
          })
          const { workflowId } = await client.workflow.start(TransferWorkflow, {
            taskQueue: 'monorepo',
            workflowId: `temporal/transfer/${user.id}/${userOpHash}`,
            args: [userOp],
          })
          await baseMainnetClient.call({
            account: entryPointAddress[baseMainnetClient.chain.id],
            to: userOp.sender,
            data: userOp.callData,
          })
          log(`Workflow Created: ${workflowId}`)
          const { data: transfer, error: transferError } = await supabaseAdmin
            .schema('temporal')
            .from('send_account_transfers')
            .select('status')
            .eq('workflow_id', workflowId)
            .single()

          if (transferError) {
            log('Error fetching transfer status', transferError)
            return { workflowId, status: null }
          }

          if (!transfer) {
            return { workflowId, status: null }
          }

          return { workflowId, status: transfer.status }
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    ),
})
