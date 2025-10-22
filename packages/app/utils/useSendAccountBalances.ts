import { baseMainnet, erc20Abi, multicall3Address } from '@my/wagmi'
import { useBalance, useReadContracts } from 'wagmi'
import { useSendAccount } from './send-accounts'
import { useTokenPrices } from './useTokenPrices'
import { convertBalanceToFiat } from './convertBalanceToUSD'
import { allCoins } from '../data/coins'
import { useMemo, useCallback } from 'react'
import type { Address, Hex } from 'viem'

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
  const { query: pricesQuery } = useTokenPrices()
  const { data: sendAccount } = useSendAccount()

  const tokenContracts = useMemo(
    () =>
      allCoins
        .filter((coin) => coin.token !== 'eth')
        .map((coin) => ({
          address: coin.token as Hex,
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
      refetchInterval: 10 * 1000,
    },
    contracts: tokenContracts,
    multicallAddress: multicall3Address[baseMainnet.id],
  })

  const unpackResult = useCallback((result: BalanceOfResult): bigint | undefined => {
    if (result && result.status === 'success') {
      return BigInt(result.result)
    }
    return undefined
  }, [])

  const ethQuery = useBalance({
    address: sendAccount?.address,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  const isLoading =
    tokensQuery.isLoading || ethQuery.isLoading || pricesQuery.isLoading || !sendAccount

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

  const dollarBalances = useMemo(() => {
    const { data: tokenPrices } = pricesQuery
    const { data: ethBalance } = ethQuery
    if (!tokenPrices || !balances) return undefined
    return allCoins.reduce(
      (values, coin) => {
        const balance = coin.token === 'eth' ? ethBalance?.value : balances[coin.token]
        // Always use $1 for USDC regardless of market price
        const price = coin.symbol === 'USDC' ? 1 : tokenPrices[coin.token]
        values[coin.token] = convertBalanceToFiat({ ...coin, balance: balance ?? 0n }, price) ?? 0

        return values
      },
      {} as Record<Address | 'eth', number>
    )
  }, [pricesQuery, ethQuery, balances])

  return { balances, isLoading, dollarBalances, ethQuery, tokensQuery, pricesQuery }
}
