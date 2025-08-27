import { useQuery } from '@tanstack/react-query'
import type { allCoins, coins, CoinWithBalance } from 'app/data/coins'
import { z } from 'zod'

// Use Pro API only when a key is present; otherwise default to Free API.
// Do not read .env directly; rely on process.env at runtime/build time.
const COINGECKO_PRO_KEY: string | undefined =
  typeof process !== 'undefined'
    ? (process.env?.COINGECKO_PRO_KEY as string | undefined)
    : undefined

export const MarketDataSchema = z
  .object({
    id: z.custom<coins[number]['coingeckoTokenId']>(),
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
  })
  .array()

export type MarketData = z.infer<typeof MarketDataSchema>

/**
 * React query function to fetch current token price for a given token id
 */
export const useTokenPrice = <T extends allCoins[number]['coingeckoTokenId']>(tokenId: T) => {
  return useQuery({
    queryKey: ['tokenPrice', tokenId],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
      )
      if (!response.ok) throw new Error(`Failed to fetch token price ${tokenId} ${response.status}`)
      const data = await response.json()
      return data as { [key in T]: { usd: number } }
    },
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch current Send token price
 */
export const useSendPrice = () => useTokenPrice('send-token-2' as const)

/**
 * Fetch coin market data
 */
export const useTokenMarketData = <
  T extends coins[number]['coingeckoTokenId'] | CoinWithBalance['coingeckoTokenId'],
>(
  tokenId: T
) => {
  return useQuery({
    queryKey: ['coin-market-data', tokenId],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?ids=${tokenId}&vs_currency=usd&price_change_percentage=24h,7d`,
        {
          headers: {
            Accept: 'application/json',
          },
          mode: 'cors',
        }
      )

      if (!response.ok) throw new Error(`Failed to fetch coin ${tokenId} ${response.status}`)
      const data = await response.json()

      const d = MarketDataSchema.parse(data)

      return d
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch coin market data for multiple tokens at once
 */
export const useMultipleTokensMarketData = <
  T extends coins[number]['coingeckoTokenId'] | CoinWithBalance['coingeckoTokenId'],
>(
  tokenIds: T[]
) => {
  // Canonicalize ids for stable caching across callers (sort + comma-join)
  const canonicalIds = Array.from(new Set(tokenIds)).sort().join(',')

  return useQuery({
    queryKey: ['coin-market-data', canonicalIds],
    enabled: canonicalIds.length > 0,
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?ids=${canonicalIds}&vs_currency=usd`,
        {
          headers: {
            Accept: 'application/json',
          },
          mode: 'cors',
        }
      )

      if (!response.ok)
        throw new Error(`Failed to fetch market data for: ${canonicalIds}, ${response.status}`)
      const data = await response.json()
      return MarketDataSchema.parse(data)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Minimal schema for /coins/{id} when only description is needed
const CoinDescriptionSchema = z
  .object({
    en: z.string().optional().nullable(),
  })
  .passthrough()

// Minimal market_data subset for /coins/{id}?market_data=true
const CoinMarketDataSchema = z
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

export const CoinDataSchema = z
  .object({
    id: z.custom<coins[number]['coingeckoTokenId']>(),
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
    description: CoinDescriptionSchema.optional(),
    market_data: CoinMarketDataSchema.optional(),
  })
  .passthrough()

export type CoinData = z.infer<typeof CoinDataSchema>

/**
 * Unified coin data hook: fetches description and market_data in a single request.
 * Endpoint: /api/v3/coins/{id}?market_data=true
 */
type UseCoinDataOptions = { includeMarketData?: boolean }

export const useCoinData = <
  T extends coins[number]['coingeckoTokenId'] | CoinWithBalance['coingeckoTokenId'],
>(
  tokenId: T,
  options?: UseCoinDataOptions
) => {
  const includeMarketData = options?.includeMarketData ?? true
  return useQuery({
    queryKey: ['coin-data', tokenId, includeMarketData],
    queryFn: async () => {
      const usePro = !!COINGECKO_PRO_KEY
      const baseUrl = usePro ? 'https://pro-api.coingecko.com' : 'https://api.coingecko.com'
      const url = `${baseUrl}/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=${includeMarketData ? 'true' : 'false'}&community_data=false&developer_data=false&sparkline=false`
      const headers: Record<string, string> = { Accept: 'application/json' }
      if (usePro && COINGECKO_PRO_KEY) headers['x-cg-pro-api-key'] = COINGECKO_PRO_KEY

      const response = await fetch(url, {
        headers,
        mode: 'cors',
      })

      if (!response.ok) throw new Error(`Failed to fetch coin data ${tokenId} ${response.status}`)
      const data = await response.json()
      return CoinDataSchema.parse(data)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
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
  T extends coins[number]['coingeckoTokenId'] | CoinWithBalance['coingeckoTokenId'],
>(
  tokenId: T,
  params: {
    days: string
    vsCurrency?: 'usd'
    interval?: string
    precision?: string
  }
) => {
  const vs = params.vsCurrency ?? 'usd'
  const days = params.days ?? '1'
  const interval = params.interval ?? null
  const precision = params.precision ?? null

  return useQuery({
    queryKey: ['coin-market-chart', tokenId, vs, days, interval, precision],
    enabled: Boolean(tokenId) && Boolean(days),
    queryFn: async () => {
      const usePro = !!COINGECKO_PRO_KEY
      const baseUrl = usePro ? 'https://pro-api.coingecko.com' : 'https://api.coingecko.com'
      const url = new URL(`${baseUrl}/api/v3/coins/${tokenId}/market_chart`)
      url.searchParams.set('vs_currency', vs)
      url.searchParams.set('days', days)

      if (interval) url.searchParams.set('interval', interval)
      if (precision) url.searchParams.set('precision', precision)

      const headers: Record<string, string> = { Accept: 'application/json' }
      if (usePro && COINGECKO_PRO_KEY) headers['x-cg-pro-api-key'] = COINGECKO_PRO_KEY

      const response = await fetch(url.toString(), {
        headers,
        mode: 'cors',
      })

      if (!response.ok)
        throw new Error(`Failed to fetch market chart for ${tokenId}: ${response.status}`)

      const data = await response.json()
      const parsed = MarketChartSchema.parse(data)
      return parsed
    },
    staleTime: 12 * 60 * 60 * 1000,
  })
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
