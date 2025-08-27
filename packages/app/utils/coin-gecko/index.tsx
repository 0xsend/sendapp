import { useQuery } from '@tanstack/react-query'
import type { allCoins, coins, CoinWithBalance } from 'app/data/coins'
import { z } from 'zod'

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
        `https://api.coingecko.com/api/v3/coins/markets?ids=${tokenId}&vs_currency=usd`,
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
  const joinedTokenIds = tokenIds.join(', ')

  return useQuery({
    queryKey: ['coin-market-data', joinedTokenIds],
    enabled: joinedTokenIds.length > 0,
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?ids=${joinedTokenIds}&vs_currency=usd`,
        {
          headers: {
            Accept: 'application/json',
          },
          mode: 'cors',
        }
      )

      if (!response.ok)
        throw new Error(`Failed to fetch market data for: ${joinedTokenIds}, ${response.status}`)
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

export const CoinDetailsSchema = z
  .object({
    description: CoinDescriptionSchema.optional(),
  })
  .passthrough()

export type CoinDetails = z.infer<typeof CoinDetailsSchema>

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
    market_cap_change_percentage_24h_in_currency: z
      .object({ usd: z.number().nullable().optional() })
      .partial()
      .optional(),
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
export const useCoinData = <
  T extends coins[number]['coingeckoTokenId'] | CoinWithBalance['coingeckoTokenId'],
>(
  tokenId: T
) => {
  return useQuery({
    queryKey: ['coin-data', tokenId],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
        {
          headers: {
            Accept: 'application/json',
          },
          mode: 'cors',
        }
      )

      if (!response.ok) throw new Error(`Failed to fetch coin data ${tokenId} ${response.status}`)
      const data = await response.json()
      return CoinDataSchema.parse(data)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * React query function to fetch minimal coin details (description only)
 */
export const useCoinDetails = <
  T extends coins[number]['coingeckoTokenId'] | CoinWithBalance['coingeckoTokenId'],
>(
  tokenId: T
) => {
  return useQuery({
    queryKey: ['coin-details', tokenId],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
        {
          headers: {
            Accept: 'application/json',
          },
          mode: 'cors',
        }
      )

      if (!response.ok)
        throw new Error(`Failed to fetch coin details ${tokenId} ${response.status}`)
      const data = await response.json()
      return CoinDetailsSchema.parse(data)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
