import { TRPCError } from '@trpc/server'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { z } from 'zod'
import { CDP_API_URL, CDP_PAY_URL, generateCoinbaseJWT } from '../helpers/coinbase'
import debug from 'debug'

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

const TokenResponseSchema = z.object({
  token: z.string(),
})

export const coinbaseRouter = createTRPCRouter({
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

  getOnrampUrl: protectedProcedure
    .input(
      z.object({
        address: z.string().regex(/^0x[0-9a-f]{40}$/i),
        blockchains: z.array(z.enum(['base'])),
        quoteId: z.string().optional(),
        defaultAsset: z.string().optional(),
        defaultPaymentMethod: z.string().optional(),
        fiatCurrency: z.string().optional(),
        presetFiatAmount: z.number().finite().min(10).max(500).optional(),
      })
    )
    .mutation(async ({ input: { address, blockchains, ...params } }) => {
      try {
        const payload = {
          addresses: [{ address, blockchains }],
        }

        const jwt = generateCoinbaseJWT('POST', '/onramp/v1/token')

        const response = await fetch(`${CDP_API_URL}/onramp/v1/token`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const rawData = await response.json()
        const data = TokenResponseSchema.parse(rawData)
        const sessionToken = data.token

        if (!sessionToken) {
          throw new Error('No session token in response')
        }

        const baseUrl = CDP_PAY_URL
        const queryParams = new URLSearchParams({ sessionToken })

        if (params.quoteId) queryParams.append('quoteId', params.quoteId)
        if (params.defaultAsset) queryParams.append('defaultAsset', params.defaultAsset)
        if (params.defaultPaymentMethod)
          queryParams.append('defaultPaymentMethod', params.defaultPaymentMethod)
        if (params.fiatCurrency) queryParams.append('fiatCurrency', params.fiatCurrency)
        if (typeof params.presetFiatAmount === 'number' && !Number.isNaN(params.presetFiatAmount))
          queryParams.append('presetFiatAmount', params.presetFiatAmount.toString())

        return {
          url: `${baseUrl}?${queryParams.toString()}`,
        }
      } catch (error) {
        log('Error getting onramp URL:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get onramp URL',
        })
      }
    }),
})
