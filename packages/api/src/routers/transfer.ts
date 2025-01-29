import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { getTemporalClient } from '@my/temporal/client'
import { getUserOperationHash, type UserOperation } from 'permissionless'
import { TransferWorkflow } from '@my/workflows/all-workflows'
import { baseMainnetClient, entryPointAddress } from '@my/wagmi'

const log = debug('api:transfer')

export const transferRouter = createTRPCRouter({
  withUserOp: protectedProcedure
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
          const chainId = baseMainnetClient.chain.id
          const entryPoint = entryPointAddress[chainId]
          const userOpHash = getUserOperationHash({
            userOperation: userOp,
            entryPoint,
            chainId,
          })
          const client = await getTemporalClient()
          const handle = await client.workflow.start(TransferWorkflow, {
            taskQueue: 'monorepo',
            workflowId: `transfer-workflow-${user.id}-${userOpHash}`,
            args: [userOp],
          })
          log(`Workflow Created: ${handle.workflowId}`)
          return handle.workflowId
        } catch (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    ),
})
