import { type coin, coinsBySymbol, type erc20Coin, erc20Coins } from 'app/data/coins'
import debug from 'debug'
import { useEffect, useMemo } from 'react'
import { createParam } from 'solito'
import { formatUnits } from 'viem'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'

const log = debug('app:earn:params')

export type Param = {
  /**
   * The amount of the asset to deposit.
   * @dev Not in decimal format.
   */
  amount?: string
  /**
   * The symbol of the asset to deposit.
   */
  asset?: string
}

export const { useParam, useParams } = createParam<Param>()

export const useAsset = () => {
  return useParam('asset')
}

export const useAmount = () => {
  const [paramAmount, setAmount] = useParam('amount')
  const amount = useMemo(() => {
    if (paramAmount === undefined) return 0n
    try {
      return BigInt(paramAmount)
    } catch (e) {
      return 0n
    }
  }, [paramAmount])
  return [amount, setAmount] as const
}

/**
 * Hook to fetch the ERC20 coin asset for the current route.
 */
export const useERC20AssetCoin = (): UseQueryReturnType<erc20Coin | null | undefined, Error> => {
  const [asset] = useAsset()
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

/**
 * Set the form amount to the params amount if it's not set.
 */
export function useInitializeFormAmount(form: {
  watch: (key: 'amount') => string | undefined
  setValue: (key: 'amount', value: string) => void
}) {
  const coin = useERC20AssetCoin()
  const [amount, setAmount] = useParam('amount')
  const formAmount = form.watch('amount')
  useEffect(() => {
    if (!coin.data?.decimals) return
    try {
      if (formAmount === undefined && amount !== undefined) {
        form.setValue('amount', formatUnits(BigInt(amount), coin.data?.decimals))
      }
    } catch (e) {
      log('error setting amount', e)
      // reset param amount if error
      setAmount(undefined, { webBehavior: 'replace' })
    }
  }, [form.setValue, formAmount, amount, setAmount, coin.data?.decimals])
}
