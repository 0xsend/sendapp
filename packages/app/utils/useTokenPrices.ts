import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

const TokenPriceSchema = z.object({
  usd: z.number(),
})

export const TokenPricesSchema = z.object({
  ethereum: TokenPriceSchema,
  'send-token': TokenPriceSchema,
  'usd-coin': TokenPriceSchema,
})

export const useTokenPrices = () => {
  const {
    data: tokenPrices,
    error,
    isLoading,
  } = useQuery({
    queryKey: ['tokenPrices'],
    queryFn: async () => {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,send-token&vs_currencies=usd'
      )
      if (!res.ok) {
        throw new Error(`Failed to fetch token prices. Status: ${res.status}`)
      }

      const json = await res.json()
      TokenPricesSchema.parse(json)

      return json
    },
  })

  return { tokenPrices, error, isLoading }
}
