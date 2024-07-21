import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import type { coins } from 'app/data/coins'
import type { Hex } from 'viem'
import { z } from 'zod'

export const MarketDataSchema = z
  .object({
    id: z.custom<coins[number]['coingeckoTokenId']>(),
    symbol: z.string(),
    name: z.string(),
    image: z.string(),
    current_price: z.number(),
    market_cap: z.number(),
    market_cap_rank: z.number(),
    fully_diluted_valuation: z.number(),
    total_volume: z.number(),
    high_24h: z.number(),
    low_24h: z.number(),
    price_change_24h: z.number(),
    price_change_percentage_24h: z.number(),
    market_cap_change_24h: z.number(),
    market_cap_change_percentage_24h: z.number(),
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

/**
 * React query function to fetch current token price for a given token id
 */
export const useTokenPrice = <T extends coins[number]['coingeckoTokenId']>(tokenId: T) => {
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
export const useSendPrice = () => useTokenPrice('send-token' as const)

/**
 * Fetch coin market data
 */
export const useTokenMarketData = <T extends coins[number]['coingeckoTokenId']>(tokenId: T) => {
  return useQuery({
    queryKey: ['coin-market-data', tokenId],
    queryFn: async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?ids=${tokenId}&vs_currency=usd`
      )

      if (!response.ok) throw new Error(`Failed to fetch coin ${tokenId} ${response.status}`)
      const data = await response.json()

      return MarketDataSchema.parse(data)
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Fetch token metadata (from contract address)
 * @param {Hex} contractAddress - token contract address
 */
export const useTokenMetadata = (contractAddress: Hex, queryParams?): UseQueryResult<object> => {
  return useQuery({
    queryKey: ['token-thumbnail', contractAddress],
    queryFn: async (): Promise<object> => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/ethereum?contract_address=${contractAddress}&vs_currency=usd`
      )

      if (!response.ok)
        throw new Error(`Failed to fetch token metadata ${contractAddress} ${response.status}`)
      const data = await response.json()

      return data
    },
    enabled: !!contractAddress,
    ...queryParams,
  })
}
