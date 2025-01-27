import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'

const log = debug('api:routers:coinbase')

export const coinbaseRouter = createTRPCRouter({
  createTransaction: protectedProcedure
    .input(
      z.object({
        transaction_id: z.string(),
        purchase_amount: z.string().transform((val) => Number(val)),
        purchase_currency: z.string(),
        payment_total: z.string().transform((val) => Number(val)),
        payment_currency: z.string(),
        payment_method: z.enum([
          'CARD',
          'ACH_BANK_ACCOUNT',
          'APPLE_PAY',
          'FIAT_WALLET',
          'CRYPTO_WALLET',
        ]),
        wallet_address: z.string(),
      })
    )
    .mutation(async ({ ctx: { session }, input }) => {
      try {
        const { error } = await supabaseAdmin.from('coinbase_transactions').insert({
          user_id: session.user.id,
          transaction_id: input.transaction_id,
          purchase_amount: input.purchase_amount,
          purchase_currency: input.purchase_currency,
          payment_total: input.payment_total,
          payment_currency: input.payment_currency,
          payment_method: input.payment_method,
          wallet_address: input.wallet_address,
        })

        if (error) {
          log('Failed to insert coinbase transaction:', error)
          throw error
        }

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
