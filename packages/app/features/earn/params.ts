import { type coin, coinsBySymbol, type erc20Coin, erc20Coins } from 'app/data/coins'
import { createParam } from 'solito'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'

const { useParam } = createParam()

export const useAsset = () => {
  const [asset] = useParam('asset')
  return asset
}

/**
 * Hook to fetch the ERC20 coin asset for the current route.
 */
export const useERC20CoinAsset = (): UseQueryReturnType<erc20Coin | null | undefined> => {
  const asset = useAsset()
  return useQuery({
    queryKey: ['coinAsset', asset] as const,
    queryFn: async ({ queryKey: [, asset] }): Promise<erc20Coin | null> => {
      if (!asset) return null
      const symbol = asset.toUpperCase()
      const coin = erc20Coins.find((coin) => coin.symbol === symbol)
      if (!coin) return null
      return coin
    },
  })
}

export function coinToParam(coin: { symbol: string }): string {
  return coin.symbol.toLowerCase()
}

export function paramToCoin(param: string): coin | null {
  const coin = coinsBySymbol[param.toUpperCase()]
  return coin ?? null
}
