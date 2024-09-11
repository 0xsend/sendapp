import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { getTemporalClient } from '@my/temporal/client'
import type { UserOperation } from 'permissionless'
import { SendTransferWorkflow, type transferState } from '@my/workflows'
import type { coinsDict } from 'app/data/coins'

const log = debug('api:transfer')

export const transferRouter = createTRPCRouter({
  withUserOp: protectedProcedure
    .input(
      z.object({
        userOp: z.custom<UserOperation<'v0.7'>>(),
        token: z.custom<keyof coinsDict>(),
      })
    )
    .mutation(async ({ input: { token, userOp } }) => {
      const { sender, nonce } = userOp
      try {
        const client = await getTemporalClient()
        const handle = await client.workflow.start(SendTransferWorkflow, {
          taskQueue: 'monorepo',
          workflowId: `send-transfer-workflow-${token}-${sender}-${nonce}`,
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
    }),
  getState: protectedProcedure.input(z.string()).query(async ({ input: workflowId }) => {
    try {
      const client = await getTemporalClient()
      const handle = client.workflow.getHandle(workflowId)
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
        const client = await getTemporalClient()
        const workflows = client.workflow.list({
          query: `ExecutionStatus = "Running" AND WorkflowId BETWEEN "send-transfer-workflow-${token}-${sender}-" AND "send-transfer-workflow-${token}-${sender}-~"`,
        })
        for await (const workflow of workflows) {
          const handle = client.workflow.getHandle(workflow.workflowId)

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
        const client = await getTemporalClient()
        const workflows = client.workflow.list({
          query: `ExecutionStatus = "Failed" AND WorkflowId BETWEEN "send-transfer-workflow-${token}-${sender}-" AND "send-transfer-workflow-${token}-${sender}-~"`,
        })
        for await (const workflow of workflows) {
          const handle = client.workflow.getHandle(workflow.workflowId)
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
