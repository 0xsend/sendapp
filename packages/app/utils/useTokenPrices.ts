import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

const TokenPriceSchema = z.object({
  usd: z.number(),
})

export const TokenPricesSchema = z.object({
  ethereum: TokenPriceSchema,
  'send-token': TokenPriceSchema,
  'usd-coin': TokenPriceSchema,
  spx6900: TokenPriceSchema,
})

export const useTokenPrices = (): UseQueryResult<z.infer<typeof TokenPricesSchema>, Error> => {
  return useQuery({
    queryKey: ['tokenPrices'],
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,send-token,spx6900&vs_currencies=usd'
      )
      if (!res.ok) {
        throw new Error(`Failed to fetch token prices. Status: ${res.status}`)
      }

      const json = await res.json()
      return TokenPricesSchema.parse(json)
    },
  })
}
