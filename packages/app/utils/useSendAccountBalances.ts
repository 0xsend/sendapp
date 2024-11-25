import { baseMainnet, erc20Abi } from '@my/wagmi'
import { useBalance, useReadContracts } from 'wagmi'
import { useSendAccount } from './send-accounts'
import { useTokenPrices } from './useTokenPrices'
import { convertBalanceToFiat } from './convertBalanceToUSD'
import { coins } from '../data/coins'
import { useEffect } from 'react'

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

  const tokenContracts = coins
    .filter((coin) => coin.token !== 'eth')
    .map((coin) => ({
      address: coin.token,
      abi: erc20Abi,
      chainId: baseMainnet.id,
      functionName: 'balanceOf',
      args: sendAccount?.address && [sendAccount?.address],
    }))

  const { data: tokenBalances, isLoading: isLoadingTokenBalances } = useReadContracts({
    query: { enabled: !!sendAccount },
    contracts: tokenContracts,
  })

  const unpackResult = (result: BalanceOfResult): bigint | undefined => {
    if (result && result.status === 'success' && BigInt(result.result) > 0n) {
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

  const balances = isLoading
    ? undefined
    : coins.reduce(
        (acc, coin) => {
          if (coin.token === 'eth') {
            acc[coin.symbol] = ethBalanceOnBase?.value
            console.log
            return acc
          }
          const idx = tokenContracts.findIndex((c) => c.address === coin.token)
          if (idx === -1) {
            console.error('No token contract found for coin', coin)
            return acc
          }
          const tokenBal = tokenBalances?.[idx]
          acc[coin.symbol] = unpackResult(tokenBal)
          return acc
        },
        {} as Record<string, bigint | undefined>
      )

  if (!tokenPrices) {
    return {
      balances,
      isLoading,
      totalBalance: undefined,
      isLoadingTotalBalance: isLoadingTokenPrices,
    }
  }

  const totalBalance = coins.reduce((total, coin) => {
    const balance = coin.token === 'eth' ? ethBalanceOnBase?.value : balances?.[coin.symbol]
    const price = tokenPrices[coin.coingeckoTokenId].usd
    return total + (convertBalanceToFiat(coin.token, balance ?? 0n, price) ?? 0)
  }, 0)

  return { balances, totalBalance, isLoading, isLoadingTotalBalance: isLoadingTokenPrices }
}
