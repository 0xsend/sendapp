import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { Connection, Client } from '@temporalio/client'
import { TransferWorkflow } from '@my/workflows/all-workflows'

const log = debug('api:transfer')

export const transferRouter = createTRPCRouter({
  transfer: protectedProcedure
    .input(
      z.object({
        sender: z.string(),
        to: z.string(),
        token: z.string().optional(),
        amount: z.string(),
        nonce: z.string(),
        signature: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { sender, nonce } = input
      try {
        const connection = await Connection.connect()
        const client = new Client({
          connection,
        })

        const handle = await client.workflow.start(TransferWorkflow, {
          taskQueue: 'monorepo',
          workflowId: `transfer-workflow-${sender}-${nonce}`,
          args: [input],
        })
        log('Started transfer handle', handle.workflowId)
        // optional: wait for client result
        const result = await handle.result()
        log('result: ', result)

        return result
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }),
})
