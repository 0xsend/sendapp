import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import * as hl from '@nktkas/hyperliquid'
import debug from 'debug'

const log = debug('api:routers:canton')

// Map CoinGecko days to Hyperliquid intervals
const DAYS_TO_INTERVAL_MAP: Record<
  string,
  {
    interval:
      | '1m'
      | '3m'
      | '5m'
      | '15m'
      | '30m'
      | '1h'
      | '2h'
      | '4h'
      | '8h'
      | '12h'
      | '1d'
      | '3d'
      | '1w'
      | '1M'
    numCandles: number
  }
> = {
  '1': { interval: '15m', numCandles: 96 },
  '7': { interval: '1h', numCandles: 168 },
  '30': { interval: '4h', numCandles: 180 },
  '90': { interval: '12h', numCandles: 180 },
  '180': { interval: '1d', numCandles: 180 },
  '365': { interval: '1d', numCandles: 365 },
  max: { interval: '1d', numCandles: 5000 },
}

/**
 * Canton router - handles Canton Network operations
 */
export const cantonRouter = createTRPCRouter({
  /**
   * Get the authenticated user's Canton wallet balance (PROTECTED)
   * Fetches from ccview.io API using the canton_wallet_address from their profile
   */
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    // Fetch user's Canton wallet address from their profile
    const supabase = createSupabaseAdminClient()
    const { data: verification, error } = await supabase
      .from('canton_party_verifications')
      .select('canton_wallet_address')
      .eq('user_id', userId)
      .single()

    if (error || !verification?.canton_wallet_address) {
      // User doesn't have a Canton wallet address verified
      return null
    }

    const partyId = verification.canton_wallet_address

    try {
      // Note: This API key is not sensitive - it's a public key used by the ccview.io browser client
      const response = await fetch(`https://ccview.io/api/v1/parties/${partyId}`, {
        headers: {
          'x-api-key': 'temp_mainnet_HsafylQwUo6yWBfSn0s5o6EDAT48Cp99jK8TH1p9kn1sqnDkxFcuSphbLQKko',
        },
      })

      if (!response.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `ccview.io API returned ${response.status}`,
        })
      }

      const data = await response.json()

      if (!data.balance || typeof data.balance.total_unlocked_coin !== 'string') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid response from ccview.io API',
        })
      }

      // Return the balance data
      return {
        total_unlocked_coin: data.balance.total_unlocked_coin,
        total_available_coin: data.balance.total_available_coin,
        round: data.balance.computed_as_of_round,
        time: data.balance.computed_as_of_time,
      }
    } catch (error) {
      log('Error fetching Canton balance from ccview.io:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Canton balance',
      })
    }
  }),

  /**
   * Get Canton market data (PUBLIC)
   * Fetches from TheTie and Hyperliquid - returns CoinGecko-compatible format
   */
  getMarketData: publicProcedure.query(async ({ ctx }) => {
    try {
      const [theTieResponse, infoClient] = await Promise.all([
        fetch('https://canton.thetie.io/overview?f=highlights'),
        Promise.resolve(new hl.InfoClient({ transport: new hl.HttpTransport() })),
      ])

      if (!theTieResponse.ok) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `TheTie API returned ${theTieResponse.status}`,
        })
      }

      const theTieData = await theTieResponse.json()

      if (!theTieData.data || theTieData.data.length === 0) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'No Canton data available from TheTie',
        })
      }

      const stats = theTieData.data[0]
      const marketCap = Number.parseFloat(stats.implied_mc)
      const circulatingSupply = Number.parseFloat(stats.canton_coin_supply)
      const totalSupply = 100_000_000_000

      const metaAndAssetCtxs = await infoClient.metaAndAssetCtxs()
      const cantonIndex = metaAndAssetCtxs[0].universe.findIndex((asset) => asset.name === 'CC')

      if (cantonIndex === -1) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Canton (CC) not found on Hyperliquid',
        })
      }

      const cantonCtx = metaAndAssetCtxs[1][cantonIndex]

      if (!cantonCtx) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Canton context not found in Hyperliquid data',
        })
      }

      const price = Number.parseFloat(cantonCtx.oraclePx)
      const prevDayPrice = Number.parseFloat(cantonCtx.prevDayPx)
      const priceChange24h = price - prevDayPrice
      const priceChangePercentage24h = (priceChange24h / prevDayPrice) * 100
      const fullyDilutedValuation = price * totalSupply

      const coingeckoData = {
        market_data: {
          id: 'canton',
          symbol: 'CC',
          name: 'Canton',
          image: '',
          current_price: price,
          market_cap: marketCap,
          market_cap_rank: null,
          fully_diluted_valuation: fullyDilutedValuation,
          total_volume: Number.parseFloat(cantonCtx.dayNtlVlm),
          high_24h: null,
          low_24h: null,
          price_change_24h: priceChange24h,
          price_change_percentage_24h: priceChangePercentage24h,
          market_cap_change_24h: null,
          market_cap_change_percentage_24h: null,
          circulating_supply: circulatingSupply,
          total_supply: totalSupply,
          max_supply: totalSupply,
          ath: price,
          ath_change_percentage: 0,
          ath_date: stats.round_date,
          atl: price,
          atl_change_percentage: 0,
          atl_date: stats.round_date,
          roi: null,
        },
        coin_data: {
          id: 'canton',
          symbol: 'cc',
          name: 'Canton',
          image: {
            thumb: '',
            small: '',
            large: '',
          },
          description: {
            en: 'Canton Network enables selective privacy, data protection, and regulatory compliance for institutional financial markets through synchronized, real-time settlement across applications.',
          },
          market_data: {
            current_price: { usd: price },
            price_change_percentage_24h: priceChangePercentage24h,
            price_change_percentage_24h_in_currency: { usd: priceChangePercentage24h },
            price_change_24h: { usd: priceChange24h },
            market_cap: { usd: marketCap },
            fully_diluted_valuation: { usd: fullyDilutedValuation },
            total_volume: { usd: Number.parseFloat(cantonCtx.dayNtlVlm) },
            circulating_supply: circulatingSupply,
            total_supply: totalSupply,
            market_cap_change_percentage_24h: null,
          },
        },
      }

      // Set cache headers via tRPC context
      try {
        ctx.res?.setHeader?.(
          'Cache-Control',
          'public, max-age=45, s-maxage=45, stale-while-revalidate=60'
        )
      } catch {}

      return coingeckoData
    } catch (error) {
      log('Error fetching Canton data:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch Canton data',
      })
    }
  }),

  /**
   * Get Canton historical chart data (PUBLIC)
   * Fetches from Hyperliquid - returns CoinGecko-compatible format
   */
  getChart: publicProcedure
    .input(
      z.object({
        days: z.enum(['1', '7', '30', '90', '180', '365', 'max']).default('7'),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        const { days } = input

        if (!DAYS_TO_INTERVAL_MAP[days]) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid days parameter',
          })
        }

        const { interval } = DAYS_TO_INTERVAL_MAP[days]

        const infoClient = new hl.InfoClient({
          transport: new hl.HttpTransport(),
        })

        const endTime = Date.now()
        const startTime = calculateStartTime(endTime, days)

        const candles = await infoClient.candleSnapshot({
          coin: 'CC',
          interval,
          startTime,
          endTime,
        })

        const prices = candles.map((candle) => [candle.T, Number.parseFloat(candle.c)])

        // Set cache headers
        try {
          ctx.res?.setHeader?.(
            'Cache-Control',
            'public, max-age=43200, s-maxage=43200, stale-while-revalidate=86400'
          )
        } catch {}

        return { prices }
      } catch (error) {
        log('Error fetching Canton chart data:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Canton chart data',
        })
      }
    }),

  /**
   * Get top senders with Canton wallets (PUBLIC)
   * Returns paginated list of top senders sorted by send score, filtered by Canton wallet holders
   * See docs/top-senders-api-implementation-plan.md for full documentation
   */
  topSenders: publicProcedure
    .input(
      z
        .object({
          pageNumber: z.number().int().min(0).default(0).optional(),
          pageSize: z.number().int().min(1).max(50).default(10).optional(),
        })
        .optional()
        .default({
          pageNumber: 0,
          pageSize: 10,
        })
    )
    .query(async ({ input }) => {
      const supabase = createSupabaseAdminClient()

      const rpcParams = {
        page_number: input.pageNumber,
        page_size: input.pageSize,
      }

      const { data, error } = await supabase.rpc('canton_top_senders', rpcParams)

      if (error) {
        log('Canton top senders RPC error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch Canton top senders',
          cause: error.message,
        })
      }

      return data ?? []
    }),
})

function calculateStartTime(endTime: number, days: string): number {
  const daysMap: Record<string, number> = {
    '1': 1,
    '7': 7,
    '30': 30,
    '90': 90,
    '180': 180,
    '365': 365,
    max: 365 * 10,
  }

  const numDays = daysMap[days] || 7
  return endTime - numDays * 24 * 60 * 60 * 1000
}
