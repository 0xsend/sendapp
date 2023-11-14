import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { verifyMessage } from 'viem'
import { verifyAddressMsg } from 'app/features/checkout/screen'

export const chainAddressRouter = createTRPCRouter({
  verify: protectedProcedure
    .input(
      z.object({
        signature: z.string(),
        address: z.string().regex(/^0x[0-9a-f]{40}$/i),
      })
    )
    .mutation(async ({ ctx: { session }, input: { address, signature } }) => {
      const verified = await verifyMessage({
        address: address as `0x${string}`,
        message: verifyAddressMsg(address),
        signature: signature as `0x${string}`,
      }).catch((e) => {
        throw new TRPCError({ code: 'BAD_REQUEST', message: e.message })
      })

      if (!verified) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Signature verification failed.' })
      }

      const { data: results, error } = await supabaseAdmin.from('chain_addresses').insert({
        address,
        user_id: session.user.id,
      })

      if (error) {
        if (error.message.includes('duplicate key value violates unique constraint'))
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Address already exists.' })
        else throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }

      return results
    }),
})
