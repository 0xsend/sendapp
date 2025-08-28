import { useQuery } from '@tanstack/react-query'
import { allCoins, type coins, type CoinWithBalance } from 'app/data/coins'
import { z } from 'zod'
import { fetchDexScreenerPrices } from '../useTokenPrices'

// Web: Routes CoinGecko Pro calls via serverless (Vercel) using tRPC.
// Native: See index.native.tsx for direct Pro usage when key present.

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

// Canonicalize token ids for stable multi-token requests and caching
const canonicalizeTokenIds = <T extends coins[number]['coingeckoTokenId']>(tokenIds: T[]) =>
  Array.from(new Set(tokenIds)).sort()

// Build a minimal MarketData object using a DexScreener-derived price
const buildFallbackMarketData = (args: {
  tokenId: coins[number]['coingeckoTokenId']
  usd: number
}): MarketData[number] => {
  const { tokenId, usd } = args
  return {
    id: tokenId,
    symbol: tokenId,
    name: tokenId,
    image: '',
    current_price: usd,
    market_cap: 0,
    market_cap_rank: null,
    fully_diluted_valuation: 0,
    total_volume: 0,
    high_24h: null,
    low_24h: null,
    price_change_24h: null,
    price_change_percentage_24h: null,
    price_change_percentage_24h_in_currency: null,
    price_change_percentage_7d_in_currency: null,
    market_cap_change_24h: null,
    market_cap_change_percentage_24h: null,
    circulating_supply: 0,
    total_supply: 0,
    max_supply: null,
    ath: 0,
    ath_change_percentage: 0,
    ath_date: '',
    atl: 0,
    atl_change_percentage: 0,
    atl_date: '',
    roi: null,
  }
}

// Fetch CoinGecko markets snapshot once for a set of ids; conditionally fill price via DexScreener
async function fetchMarketsSnapshot<T extends coins[number]['coingeckoTokenId']>(
  tokenIds: T[]
): Promise<MarketData> {
  const ids = canonicalizeTokenIds(tokenIds)
  const canonicalIds = ids.join(',')

  // Attempt CoinGecko /coins/markets once
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?ids=${canonicalIds}&vs_currency=usd&price_change_percentage=24h,7d`,
      {
        headers: { Accept: 'application/json' },
        mode: 'cors',
      }
    )

    if (!response.ok) throw new Error(`Failed to fetch markets: ${response.status}`)
    const raw = await response.json()
    const cgData = MarketDataSchema.parse(raw)

    // Determine which requested ids are still missing
    const present = new Set(cgData.map((d) => d.id))
    const missing = ids.filter((id) => !present.has(id))

    if (missing.length === 0) {
      // No need for DexScreener
      return cgData
    }

    // Fetch DexScreener once for any missing ids we can map
    const dexPrices = await fetchDexScreenerPrices()

    const fallback = missing
      .map((id) => {
        const coin = allCoins.find((c) => c.coingeckoTokenId === id)
        if (!coin) return null
        const key = coin.token as string
        const usd = dexPrices[key]
        if (typeof usd !== 'number') return null
        return buildFallbackMarketData({ tokenId: id, usd })
      })
      .filter(Boolean) as MarketData

    return [...cgData, ...fallback]
  } catch (err) {
    // Entire CG call failed: fall back to DexScreener for all ids we can map
    const dexPrices = await fetchDexScreenerPrices()
    const fallback = ids
      .map((id) => {
        const coin = allCoins.find((c) => c.coingeckoTokenId === id)
        if (!coin) return null
        const key = coin.token as string
        const usd = dexPrices[key]
        if (typeof usd !== 'number') return null
        return buildFallbackMarketData({ tokenId: id, usd })
      })
      .filter(Boolean) as MarketData

    if (fallback.length === 0) {
      // Surface error behavior same as before when both fail
      throw err
    }

    return fallback
  }
}

// Unified snapshot hook used by web hooks
export const useTokensMarketSnapshot = <
  T extends coins[number]['coingeckoTokenId'] | CoinWithBalance['coingeckoTokenId'],
>(
  tokenIds: T[]
) => {
  const ids = canonicalizeTokenIds(tokenIds)
  const canonicalIds = ids.join(',')
  return useQuery({
    queryKey: ['cg:markets', canonicalIds, ids, 'usd', '24h,7d'],
    enabled: canonicalIds.length > 0,
    queryFn: async () => fetchMarketsSnapshot(ids as coins[number]['coingeckoTokenId'][]),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * React query function to fetch current token price for a given token id.
 * Adapter over the unified market snapshot; retains DexScreener fallback behavior.
 */
export const useTokenPrice = <T extends allCoins[number]['coingeckoTokenId']>(tokenId: T) => {
  const ids = [tokenId] as T[]
  const canonicalIds = canonicalizeTokenIds(ids).join(',')
  return useQuery({
    queryKey: ['cg:markets', canonicalIds, ids, 'usd', '24h,7d'],
    queryFn: async () => fetchMarketsSnapshot(ids as coins[number]['coingeckoTokenId'][]),
    // Derive the legacy simple/price shape from snapshot data
    select: (arr: MarketData) => {
      const price = arr?.[0]?.current_price ?? 0
      return { [tokenId]: { usd: price } } as { [key in T]: { usd: number } }
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
 * Fetch coin market data (delegates to unified snapshot)
 */
export const useTokenMarketData = <
  T extends coins[number]['coingeckoTokenId'] | CoinWithBalance['coingeckoTokenId'],
>(
  tokenId: T
) => {
  return useTokensMarketSnapshot([tokenId])
}

/**
 * Fetch coin market data for multiple tokens at once (delegates to unified snapshot)
 */
export const useMultipleTokensMarketData = <
  T extends coins[number]['coingeckoTokenId'] | CoinWithBalance['coingeckoTokenId'],
>(
  tokenIds: T[]
) => {
  return useTokensMarketSnapshot(tokenIds)
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
    queryKey: ['cg:coin', tokenId, includeMarketData],
    queryFn: async () => {
      const url = `https://api.coingecko.com/api/v3/coins/${tokenId}?market_data=${includeMarketData ? 'true' : 'false'}`
      const response = await fetch(url, { headers: { Accept: 'application/json' }, mode: 'cors' })
      if (!response.ok) throw new Error(`Failed to fetch coin data: ${response.status}`)
      const raw = await response.json()
      return CoinDataSchema.parse(raw)
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

  const qs = new URLSearchParams({ vs_currency: vs, days })
  if (interval) qs.set('interval', interval)
  if (precision) qs.set('precision', precision)
  const url = `https://api.coingecko.com/api/v3/coins/${tokenId}/market_chart?${qs.toString()}`

  return useQuery({
    queryKey: ['cg:market_chart', tokenId, vs, days, interval, precision, url],
    queryFn: async () => {
      const response = await fetch(url, { headers: { Accept: 'application/json' }, mode: 'cors' })
      if (!response.ok) throw new Error(`Failed to fetch market chart: ${response.status}`)
      const raw = await response.json()
      return MarketChartSchema.parse(raw)
    },
    enabled: Boolean(tokenId) && Boolean(days),
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
