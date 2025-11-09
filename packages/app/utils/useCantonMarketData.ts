import { z } from 'zod'
import { api } from './api'

// Canton API now returns CoinGecko-compatible format with Hyperliquid oracle price and 24h change
const CantonApiResponseSchema = z.object({
  market_data: z.object({
    id: z.literal('canton'),
    symbol: z.string(),
    name: z.string(),
    image: z.string(),
    current_price: z.number(), // Oracle price from Hyperliquid
    market_cap: z.number(),
    market_cap_rank: z.number().nullable(),
    fully_diluted_valuation: z.number(),
    total_volume: z.number(), // 24h volume from Hyperliquid
    high_24h: z.number().nullable(),
    low_24h: z.number().nullable(),
    price_change_24h: z.number(),
    price_change_percentage_24h: z.number(),
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
    roi: z.null(),
  }),
  coin_data: z.object({
    id: z.literal('canton'),
    symbol: z.string(),
    name: z.string(),
    image: z.object({
      thumb: z.string(),
      small: z.string(),
      large: z.string(),
    }),
    description: z.object({
      en: z.string(),
    }),
    market_data: z.object({
      current_price: z.object({ usd: z.number() }), // Oracle price from Hyperliquid
      price_change_percentage_24h: z.number(),
      price_change_percentage_24h_in_currency: z.object({ usd: z.number() }),
      price_change_24h: z.object({ usd: z.number() }),
      market_cap: z.object({ usd: z.number() }),
      fully_diluted_valuation: z.object({ usd: z.number() }),
      total_volume: z.object({ usd: z.number() }),
      circulating_supply: z.number(),
      market_cap_change_percentage_24h: z.number().nullable(),
    }),
  }),
})

export type CantonApiResponse = z.infer<typeof CantonApiResponseSchema>

export type CantonMarketData = CantonApiResponse['market_data']
export type CantonCoinData = CantonApiResponse['coin_data']

/**
 * Hook to fetch Canton market data in CoinGecko-compatible format
 * Used internally by useTokensMarketData to merge Canton data with CoinGecko data
 */
export const useCantonMarketData = () => {
  return api.canton.getMarketData.useQuery(undefined, {
    staleTime: 45000, // Match CoinGecko market data stale time
    refetchInterval: 45000, // Match CoinGecko market data refetch interval
    select: (data) => data.market_data,
  })
}
