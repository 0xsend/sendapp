import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { getTemporalClient } from '@my/temporal/client'
import type { UserOperation } from 'permissionless'
import { TransferWorkflow, type transferState } from '@my/workflows'
import type { coinsDict } from 'app/data/coins'

const log = debug('api:transfer')

export const transferRouter = createTRPCRouter({
  withUserOp: protectedProcedure
    .input(
      z.object({
        userOp: z.custom<UserOperation<'v0.7'>>(),
        token: z.custom<keyof coinsDict>(), //@ todo: might be safer to decode the token from the userOp, to ensure we don't apply the wrong token
      })
    )
    .mutation(async ({ input: { token, userOp } }) => {
      const { sender, nonce } = userOp
      try {
        const handle = await getTemporalClient().workflow.start(TransferWorkflow, {
          taskQueue: 'monorepo',
          workflowId: `transfer-workflow-${token}-${sender}-${nonce}`,
          args: [userOp],
        })
        log('Started transfer handle', handle.workflowId)
        // optional: wait for client result
        return await handle.workflowId
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }),
  getState: protectedProcedure.input(z.string()).query(async ({ input: workflowId }) => {
    try {
      const handle = await getTemporalClient().workflow.getHandle(workflowId)
      const state = await handle.query<transferState, []>('getTransferState')
      return state
    } catch (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }),
  getPending: protectedProcedure
    .input(
      z.object({
        token: z.custom<keyof coinsDict>(),
        sender: z.string(),
      })
    )
    .query(async ({ input: { token, sender } }) => {
      try {
        const states: transferState[] = []
        const workflows = await getTemporalClient().workflow.list({
          query: `ExecutionStatus = "Running" AND WorkflowId BETWEEN "transfer-workflow-${token}-${sender}-" AND "transfer-workflow-${token}-${sender}-~"`,
        })
        for await (const workflow of workflows) {
          const handle = await getTemporalClient().workflow.getHandle(workflow.workflowId)

          const state = await handle.query<transferState, []>('getTransferState')
          states.push(state)
        }
        return states
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }),
  getFailed: protectedProcedure
    .input(
      z.object({
        token: z.custom<keyof coinsDict>(),
        sender: z.string(),
      })
    )
    .query(async ({ input: { token, sender } }) => {
      try {
        const states: transferState[] = []
        const workflows = await getTemporalClient().workflow.list({
          query: `ExecutionStatus = "Failed" AND WorkflowId BETWEEN "transfer-workflow-${token}-${sender}-" AND "transfer-workflow-${token}-${sender}-~"`,
        })
        for await (const workflow of workflows) {
          const handle = await getTemporalClient().workflow.getHandle(workflow.workflowId)
          const state = await handle.query<transferState, []>('getTransferState')
          states.push(state)
        }
        return states
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          cause: error,
        })
      }
    }),
})
