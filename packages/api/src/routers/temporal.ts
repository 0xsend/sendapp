import { getTemporalClient } from '@my/temporal/client'
import { baseMainnetClient, entryPointAddress } from '@my/wagmi'
import { startWorkflow } from '@my/workflows/utils'
import { TRPCError } from '@trpc/server'
import { formFields } from 'app/utils/SchemaForm'
import { assert } from 'app/utils/assert'
import debug from 'debug'
import type { UserOperation } from 'permissionless'
import { getUserOperationHash } from 'permissionless/utils'
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

        return { workflowId }
      }
    ),
})
