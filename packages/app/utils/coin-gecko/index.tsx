import type { CoingeckoId, coins, CoinWithBalance } from 'app/data/coins'
import { allCoins, COINGECKO_IDS } from 'app/data/coins'
import { z } from 'zod'
import { api } from 'app/utils/api'

// Market data is now fetched via our server API for centralized caching and fault tolerance.
// Detailed coin data and charts are also fetched via server API (Pro keys stay server-only).

// Strict runtime validation against supported CoinGecko IDs
export const CoinIdEnum = z.enum(COINGECKO_IDS)

export const MarketDataSchema = z
  .object({
    id: CoinIdEnum,
    symbol: z.string(),
    name: z.string(),
    image: z.string(),
    current_price: z.number(),
    market_cap: z.number(),
    market_cap_rank: z.number().nullable(),
    fully_diluted_valuation: z.number(),
    total_volume: z.number(),
    high_24h: z.number().nullable(),
    low_24h: z.number().nullable(),
    price_change_24h: z.number().nullable(),
    price_change_percentage_24h: z.number().nullable(),
    // When requesting price_change_percentage=24h,7d the API also returns
    // *_in_currency fields per vs_currency (usd)
    price_change_percentage_24h_in_currency: z.number().nullable().optional(),
    price_change_percentage_7d_in_currency: z.number().nullable().optional(),
    market_cap_change_24h: z.number().nullable(),
    market_cap_change_percentage_24h: z.number().nullable(),
    circulating_supply: z.number(),
    total_supply: z.number(),
    max_supply: z.number().nullable(),
    ath: z.number(),
    ath_change_percentage: z.number(),
    ath_date: z.string(),
    atl: z.number(),
    atl_change_percentage: z.number(),
    atl_date: z.string(),
    roi: z
      .object({
        times: z.number(),
        currency: z.string(),
        percentage: z.number(),
      })
      .nullable(),
    last_updated: z.string(),
  })
  .array()

export type MarketData = z.infer<typeof MarketDataSchema>
/**
/**
 * React query function to fetch current token price for a given token id
 * Delegates to the multi-token markets fetch and selects the first.
 */
export const useTokenPrice = (tokenId: CoingeckoId) => {
  const q = useTokensMarketData()
  const price = q.data?.find((m) => m.id === tokenId)?.current_price ?? 0
  return {
    ...q,
    data:
      tokenId && q.data
        ? ({ [tokenId]: { usd: price } } as { [key in CoingeckoId]: { usd: number } })
        : undefined,
  }
}

/**
 * Fetch current Send token price
 */
export const useSendPrice = () => useTokenPrice('send-token-2' as const)

/**
 * Fetch coin market data for multiple tokens at once via our server API.
 * The server provides centralized caching and fault tolerance - if CoinGecko
 * fails, users receive cached prices instead of errors.
 */
export const useTokensMarketData = <R = MarketData>(options?: {
  select?: (data: MarketData) => R
  enabled?: boolean
}) => {
  // Filter out coins without CoinGecko IDs
  const ids = allCoins
    .map((c) => c.coingeckoTokenId)
    .filter((id): id is CoingeckoId => id !== undefined)

  const query = api.coinGecko.getMarketsData.useQuery(
    { ids, vsCurrency: 'usd', priceChangePercentage: ['24h', '7d'] },
    {
      enabled: (options?.enabled ?? true) && ids.length > 0,
      staleTime: 15_000,
      refetchInterval: 15_000,
      select: (result) => {
        // Extract data from server response, apply user's select if provided
        const data = result.data
        return options?.select ? options.select(data) : (data as R)
      },
    }
  )

  return query
}

// Minimal schema for /coins/{id} when only description is needed
const CoingeckoCoinDescriptionSchema = z
  .object({
    en: z.string().optional().nullable(),
  })
  .passthrough()

// Minimal market_data subset for /coins/{id}?market_data=true
const CoingeckoCoinMarketSchema = z
  .object({
    current_price: z
      .object({
        usd: z.number().nullable().optional(),
      })
      .partial()
      .optional(),
    price_change_percentage_24h: z.number().nullable().optional(),
    price_change_percentage_24h_in_currency: z
      .object({ usd: z.number().nullable().optional() })
      .partial()
      .optional(),
    market_cap: z.object({ usd: z.number().nullable().optional() }).partial().optional(),
    fully_diluted_valuation: z
      .object({ usd: z.number().nullable().optional() })
      .partial()
      .optional(),
    total_volume: z.object({ usd: z.number().nullable().optional() }).partial().optional(),
    circulating_supply: z.number().nullable().optional(),
    market_cap_change_percentage_24h: z.number().nullable().optional(),
  })
  .partial()

export const CoingeckoCoinSchema = z
  .object({
    id: z.enum(COINGECKO_IDS),
    symbol: z.string(),
    name: z.string(),
    image: z
      .object({
        thumb: z.string().optional(),
        small: z.string().optional(),
        large: z.string().optional(),
      })
      .partial()
      .optional(),
    description: CoingeckoCoinDescriptionSchema.optional(),
    market_data: CoingeckoCoinMarketSchema.optional(),
  })
  .passthrough()

export type CoingeckoCoin = z.infer<typeof CoingeckoCoinSchema>

/**
 * Unified coin data hook: fetches description and market_data in a single request.
 * Endpoint: /api/v3/coins/{id}?market_data=true
 */

export const useCoingeckoCoin = <
  T extends coins[number]['coingeckoTokenId'] | CoinWithBalance['coingeckoTokenId'] | undefined,
>(
  tokenId: T
) => {
  return api.coinGecko.getCoingeckoCoin.useQuery(
    // @ts-expect-error - disable when undefined
    { token: tokenId },
    { enabled: Boolean(tokenId), staleTime: 1000 * 60 * 5 }
  )
}

/**
 * Coin historical chart data (prices)
 * Endpoint: /api/v3/coins/{id}/market_chart
 * Notes:
 * - We only parse and return `prices` per the product need; other fields are passthrough/ignored.
 * - days is a string
 *
 *
 * Pattern and style follow existing examples in this repo:
 * - Fetch + headers + error handling mirrors useTokenMarketData and useTokenPrices
 * - Zod tuple/object parsing mirrors existing schemas in this file
 */
const PricesTupleSchema = z.tuple([z.number(), z.number()])
export const MarketChartSchema = z
  .object({
    prices: PricesTupleSchema.array(),
  })
  .passthrough()

export type MarketChart = z.infer<typeof MarketChartSchema>

export const useTokenMarketChart = <
  T extends coins[number]['coingeckoTokenId'] | CoinWithBalance['coingeckoTokenId'] | undefined,
>(
  tokenId: T,
  params: {
    days: '1' | '7' | '30' | '90' | '180' | '365' | 'max'
    vsCurrency?: 'usd'
  }
) => {
  const vs = params.vsCurrency ?? 'usd'
  const days = params.days ?? '1'

  return api.coinGecko.getMarketChart.useQuery(
    {
      // @ts-expect-error - disable when undefined
      token: tokenId,
      vsCurrency: vs,
      days,
      precision: 'full',
    },
    {
      enabled: Boolean(tokenId) && Boolean(days),
      staleTime: 12 * 60 * 60 * 1000,
    }
  )
}

/**
 * Adapter: map CoinGecko market_chart prices to chart points { x, y }.
 * which transforms [x, y] tuples into { x, y } objects.
 */
export type ChartPoint = { x: number; y: number }
export function toChartPointsFromPrices(input: Pick<MarketChart, 'prices'>): ChartPoint[] {
  const prices = input?.prices ?? []
  // CG returns timestamps ascending; keep order to match UI expectations.
  return prices.map(([ts, price]) => ({ x: ts, y: price }))
}
