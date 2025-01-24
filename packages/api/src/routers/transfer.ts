import { TRPCError } from '@trpc/server'
import debug from 'debug'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { getTemporalClient } from '@my/temporal/client'
import type { UserOperation } from 'permissionless'
import { TransferWorkflow, type transferState } from '@my/workflows/all-workflows'
import type { allCoins } from 'app/data/coins'

const log = debug('api:transfer')

export const transferRouter = createTRPCRouter({
  withUserOp: protectedProcedure
    .input(
      z.object({
        userOp: z.custom<UserOperation<'v0.7'>>(),
        token: z.custom<allCoins[number]['token']>(), //@ todo: might be safer to decode the token from the userOp, to ensure we don't apply the wrong token
        note: z.string().optional(),
      })
    )
    .mutation(async ({ input: { token, userOp, note } }) => {
      const { sender, nonce } = userOp
      try {
        const client = await getTemporalClient()
        const handle = await client.workflow.start(TransferWorkflow, {
          taskQueue: 'monorepo',
          workflowId: `transfer-workflow-${token}-${sender}-${nonce}`,
          args: [userOp, note],
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
        token: z.custom<allCoins[number]['token']>(),
        sender: z.string(),
      })
    )
    .query(async ({ input: { token, sender } }) => {
      try {
        const states: transferState[] = []
        const client = await getTemporalClient()
        const workflows = client.workflow.list({
          query: `ExecutionStatus = "Running" AND WorkflowId BETWEEN "transfer-workflow-${token}-${sender}-" AND "transfer-workflow-${token}-${sender}-~"`,
        })
        for await (const workflow of workflows) {
          const handle = client.workflow.getHandle(workflow.workflowId)
          console.log('handle: ', handle)

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
        token: z.custom<allCoins[number]['token']>(),
        sender: z.string(),
      })
    )
    .query(async ({ input: { token, sender } }) => {
      try {
        const states: transferState[] = []
        const client = await getTemporalClient()
        const workflows = client.workflow.list({
          query: `ExecutionStatus = "Failed" AND WorkflowId BETWEEN "transfer-workflow-${token}-${sender}-" AND "transfer-workflow-${token}-${sender}-~"`,
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
