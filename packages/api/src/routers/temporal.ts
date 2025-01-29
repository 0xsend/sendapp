import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { getTemporalClient } from '@my/temporal/client'
import { TransferWorkflow } from '@my/workflows/all-workflows'

const log = debug('api:temporal')

export const temporalRouter = createTRPCRouter({
  transfer: protectedProcedure
    .input(
      z.object({
        userOpHash: z.custom<`0x${string}`>(),
      })
    )
    .mutation(
      async ({
        input: { userOpHash },
        ctx: {
          session: { user },
        },
      }) => {
        try {
          const client = await getTemporalClient()
          const { workflowId } = await client.workflow.start(TransferWorkflow, {
            taskQueue: 'monorepo',
            workflowId: `transfer-workflow-${user.id}-${userOpHash}`,
            args: [userOpHash],
          })
          log(`Workflow Created: ${workflowId}`)
          return workflowId
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    ),
})
