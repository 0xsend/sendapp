import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { address } from 'app/utils/zod'
import { SendAccountCallsSchema, UserOperationSchema } from 'app/utils/zod/evm'
import debug from 'debug'
import { getTemporalClient } from '@my/temporal/client'
import { DepositWorkflow } from '@my/workflows/deposit-workflow'
import { getUserOpHash } from 'permissionless'
import { baseMainnet } from '@my/wagmi'
import { WorkflowExecutionAlreadyStartedError } from '@temporalio/client'
import { TRPCError } from '@trpc/server'

export const sendEarnRouter = createTRPCRouter({
  deposit: protectedProcedure
    .input(
      z.object({
        /**
         * The user op for the deposit.
         */
        userop: UserOperationSchema,
        /**
         * The send account calls to prove the userop is for the deposit.
         */
        sendAccountCalls: SendAccountCallsSchema,
        entryPoint: address,
      })
    )
    .mutation(async ({ ctx: { session }, input: { userop, entryPoint } }) => {
      const log = debug(`api:routers:sendEarn:${session.user.id}:deposit`)
      log('Received deposit request', { userop, entryPoint })

      const client = await getTemporalClient()
      const userOpHash = getUserOpHash({
        userOperation: userop,
        entryPoint: entryPoint,
        chainId: baseMainnet.id,
      })

      const workflowId = `temporal/deposit/${session.user.id}/${userOpHash}`
      log(`Starting DepositWorkflow with ID: ${workflowId}`)

      try {
        await client.workflow.start(DepositWorkflow, {
          args: [userop],
          taskQueue: 'monorepo',
          workflowId: workflowId,
        })
        log(`Workflow ${workflowId} started successfully.`)
      } catch (error) {
        if (error instanceof WorkflowExecutionAlreadyStartedError) {
          log(`Workflow ${workflowId} already exists.`)
        } else {
          log(`Failed to start workflow ${workflowId}`, error)
          console.error(`Failed to start workflow ${workflowId}`, error)
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to start deposit workflow.',
            cause: error,
          })
        }
      }

      return { workflowId }
    }),
})
