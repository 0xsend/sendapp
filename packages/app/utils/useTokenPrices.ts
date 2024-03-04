import { useQuery } from '@tanstack/react-query'

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
      return await res.json()
    },
  })

  return { tokenPrices, error, isLoading }
}
