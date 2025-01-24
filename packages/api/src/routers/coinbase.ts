import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import debug from 'debug'
import { CDP_API_URL, generateCoinbaseJWT } from '../helpers/coinbase'

const log = debug('api:routers:coinbase')

const QuoteResponseSchema = z.object({
  payment_total: z.object({
    value: z.string(),
    currency: z.string(),
  }),
  payment_subtotal: z.object({
    value: z.string(),
    currency: z.string(),
  }),
  purchase_amount: z.object({
    value: z.string(),
    currency: z.string(),
  }),
  network_fee: z.object({
    value: z.string(),
    currency: z.string(),
  }),
  coinbase_fee: z.object({
    value: z.string(),
    currency: z.string(),
  }),
  quote_id: z.string(),
})

export const coinbaseRouter = createTRPCRouter({
  // https://docs.cdp.coinbase.com/onramp/docs/api-generating-quotes
  getQuote: protectedProcedure
    .input(
      z.object({
        purchase_currency: z.string(),
        payment_amount: z.string(),
        payment_currency: z.string(),
        payment_method: z.string(),
        country: z.string(),
        subdivision: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const jwt = generateCoinbaseJWT('POST', '/onramp/v1/buy/quote')

        const response = await fetch(`${CDP_API_URL}/onramp/v1/buy/quote`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(input),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const rawData = await response.json()
        const data = QuoteResponseSchema.parse(rawData)
        return data
      } catch (error) {
        log('Error getting quote:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get quote',
        })
      }
    }),
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
