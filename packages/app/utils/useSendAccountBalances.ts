import { baseMainnet, erc20Abi, multicall3Address } from '@my/wagmi'
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
  const pricesQuery = useTokenPrices()
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

  const tokensQuery = useReadContracts({
    query: {
      enabled: !!sendAccount,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      refetchOnMount: true,
      refetchInterval: 10 * 1000,
      staleTime: 10 * 1000,
    },
    contracts: tokenContracts,
    multicallAddress: multicall3Address[baseMainnet.id],
  })

  const unpackResult = (result: BalanceOfResult): bigint | undefined => {
    if (result && result.status === 'success') {
      return BigInt(result.result)
    }
    return undefined
  }

  const ethQuery = useBalance({
    address: sendAccount?.address,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  const isLoading = tokensQuery.isLoading || ethQuery.isLoading

  const balances = useMemo(() => {
    if (isLoading) return undefined

    return allCoins.reduce(
      (acc, coin) => {
        if (coin.token === 'eth') {
          acc[coin.symbol] = ethQuery.data?.value
          return acc
        }
        const idx = tokenContracts.findIndex((c) => c.address === coin.token)
        if (idx === -1) {
          console.error('No token contract found for coin', coin)
          return acc
        }
        const tokenBal = tokensQuery.data?.[idx]
        acc[coin.token] = unpackResult(tokenBal)
        return acc
      },
      {} as Record<string, bigint | undefined>
    )
  }, [isLoading, ethQuery, tokensQuery, tokenContracts, unpackResult])

  const totalPrice = useMemo(() => {
    const { data: tokenPrices } = pricesQuery
    const { data: ethBalance } = ethQuery
    if (!tokenPrices || !balances) return undefined

    return allCoins.reduce((total, coin) => {
      const balance = coin.token === 'eth' ? ethBalance?.value : balances[coin.token]
      const price = tokenPrices[coin.coingeckoTokenId].usd
      return total + (convertBalanceToFiat({ ...coin, balance: balance ?? 0n }, price) ?? 0)
    }, 0)
  }, [pricesQuery, balances, ethQuery])

  return { balances, isLoading, totalPrice, ethQuery, tokensQuery, pricesQuery }
}
