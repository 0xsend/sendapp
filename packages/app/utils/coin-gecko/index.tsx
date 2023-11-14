import { useQuery } from '@tanstack/react-query'

/**
 * React query function to fetch current token price for a given token id
 */
export const useTokenPrice = <T extends string>(tokenId: T) => {
  return useQuery(
    ['tokenPrice', tokenId],
    async () => {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`
      )
      if (!response.ok) throw new Error(`Failed to fetch token price ${tokenId} ${response.status}`)
      const data = await response.json()
      return data as { [key in T]: { usd: number } }
    },
    {
      refetchInterval: 1000 * 60 * 5, // 5 minutes
    }
  )
}

/**
 * Fetch current Send token price
 */
export const useSendPrice = () => useTokenPrice('send-token' as const)
