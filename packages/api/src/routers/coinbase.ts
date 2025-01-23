import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
// import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'

const log = debug('api:routers:coinbase')

export const coinbaseRouter = createTRPCRouter({
  createTransaction: protectedProcedure
    .input(
      z.object({
        transaction_id: z.string(),
        purchase_amount: z.string(),
        purchase_currency: z.string(),
        payment_total: z.string(),
        payment_currency: z.string(),
        payment_method: z.enum([
          'CARD',
          'ACH_BANK_ACCOUNT',
          'APPLE_PAY',
          'FIAT_WALLET',
          'CRYPTO_WALLET',
        ]),
        wallet_address: z.string(),
        country: z.string(),
      })
    )
    .mutation(async ({ ctx: { session }, input }) => {
      try {
        // TODO: Insert transaction into database
        return { success: true }
      } catch (error) {
        log('Error creating transaction:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create transaction',
        })
      }
    }),
})
