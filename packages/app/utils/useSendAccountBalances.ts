import { baseMainnet, erc20Abi } from '@my/wagmi'
import { useBalance, useReadContracts } from 'wagmi'
import { useSendAccount } from './send-accounts'
import { useTokenPrices } from './useTokenPrices'
import { convertBalanceToFiat } from './convertBalanceToUSD'
import { allCoins } from '../data/coins'
import { useMemo } from 'react'

type BalanceOfResult =
  | {
      error?: undefined
      result: string | number | bigint
      status: 'success'
    }
  | {
      error: Error
      result?: undefined
      status: 'failure'
    }
  | undefined

export const useSendAccountBalances = () => {
  const { data: tokenPrices, isLoading: isLoadingTokenPrices } = useTokenPrices()
  const { data: sendAccount } = useSendAccount()

  const tokenContracts = useMemo(
    () =>
      allCoins
        .filter((coin) => coin.token !== 'eth')
        .map((coin) => ({
          address: coin.token,
          abi: erc20Abi,
          chainId: baseMainnet.id,
          functionName: 'balanceOf',
          args: sendAccount?.address && [sendAccount?.address],
        })),
    [sendAccount?.address]
  )

  const { data: tokenBalances, isLoading: isLoadingTokenBalances } = useReadContracts({
    query: { enabled: !!sendAccount },
    contracts: tokenContracts,
  })

  const unpackResult = (result: BalanceOfResult): bigint | undefined => {
    if (result && result.status === 'success') {
      return BigInt(result.result)
    }
    return undefined
  }

  const { data: ethBalanceOnBase, isLoading: isLoadingEthBalanceOnBase } = useBalance({
    address: sendAccount?.address,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  const isLoading = isLoadingTokenBalances || isLoadingEthBalanceOnBase

  const balances = useMemo(() => {
    if (isLoading) return undefined

    return allCoins.reduce(
      (acc, coin) => {
        if (coin.token === 'eth') {
          acc[coin.symbol] = ethBalanceOnBase?.value
          return acc
        }
        const idx = tokenContracts.findIndex((c) => c.address === coin.token)
        if (idx === -1) {
          console.error('No token contract found for coin', coin)
          return acc
        }
        const tokenBal = tokenBalances?.[idx]
        acc[coin.token] = unpackResult(tokenBal)
        return acc
      },
      {} as Record<string, bigint | undefined>
    )
  }, [isLoading, ethBalanceOnBase?.value, tokenBalances, tokenContracts, unpackResult])

  const totalBalance = useMemo(() => {
    if (!tokenPrices || !balances) return undefined

    return allCoins.reduce((total, coin) => {
      const balance = coin.token === 'eth' ? ethBalanceOnBase?.value : balances[coin.token]
      const price = tokenPrices[coin.coingeckoTokenId].usd
      return total + (convertBalanceToFiat({ ...coin, balance: balance ?? 0n }, price) ?? 0)
    }, 0)
  }, [tokenPrices, balances, ethBalanceOnBase?.value])

  return { balances, totalBalance, isLoading, isLoadingTotalBalance: isLoadingTokenPrices }
}
