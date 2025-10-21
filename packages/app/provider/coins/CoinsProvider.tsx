import { createContext, useContext, useMemo } from 'react'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import type { allCoins, CoinWithBalance } from 'app/data/coins'
import { useTokenPrices } from 'app/utils/useTokenPrices'
import {
  coins as coinsOg,
  partnerCoins,
  allCoins as allCoinsList,
  investmentCoins as investmentCoinsList,
  stableCoins as stableCoinsList,
} from 'app/data/coins'
import { isAddress } from 'viem'
import type { UseQueryResult } from '@tanstack/react-query'
import type { UseBalanceReturnType, UseReadContractsReturnType } from 'wagmi'

type CoinsContextType = {
  coins: CoinWithBalance[]
  allCoins: CoinWithBalance[]
  investmentCoins: CoinWithBalance[]
  stableCoins: CoinWithBalance[]
  isLoading: boolean
  ethQuery: UseBalanceReturnType
  tokensQuery: UseReadContractsReturnType
  pricesQuery: UseQueryResult<Record<allCoins[number]['token'], number>, Error>
}

const CoinsContext = createContext<CoinsContextType | undefined>(undefined)

export function CoinsProvider({ children }: { children: React.ReactNode }) {
  const { balances, isLoading: isLoadingBalances, ethQuery, tokensQuery } = useSendAccountBalances()
  // Defer any external price fetching until session is present (handled inside useTokenPrices)
  const pricesQuery = useTokenPrices()

  const isLoading = isLoadingBalances || pricesQuery.isLoading

  const coins = useMemo(() => {
    // Create coins array regardless of balances
    const coinsWithBalances = coinsOg.map((coin) => ({
      ...coin,
      balance: balances?.[coin.token === 'eth' ? coin.symbol : coin.token],
    }))

    if (!balances) {
      return coinsWithBalances
    }

    // Only include partner coins with non-zero balances
    const activePartnerCoins = partnerCoins
      .filter((coin) => {
        const balance = balances?.[coin.token === 'eth' ? coin.symbol : coin.token]
        return balance !== undefined && balance > 0n
      })
      .map((coin) => ({
        ...coin,
        balance: balances?.[coin.token === 'eth' ? coin.symbol : coin.token],
      }))

    return [...coinsWithBalances, ...activePartnerCoins]
  }, [balances])

  const allCoins = useMemo(() => {
    return allCoinsList.map((coin) => ({
      ...coin,
      balance: balances?.[coin.token === 'eth' ? coin.symbol : coin.token],
    }))
  }, [balances])

  const investmentCoins = useMemo(() => {
    return investmentCoinsList
      .filter((coin) => {
        const balance = balances?.[coin.token === 'eth' ? coin.symbol : coin.token]
        return (balance !== undefined && balance > 0n) || coin.symbol === 'SEND'
      })
      .map((coin) => ({
        ...coin,
        balance: balances?.[coin.token === 'eth' ? coin.symbol : coin.token],
      }))
  }, [balances])

  const stableCoins = useMemo(() => {
    return stableCoinsList
      .filter((coin) => {
        const balance = balances?.[coin.token]
        return (balance !== undefined && balance > 0n) || coin.symbol === 'USDC'
      })
      .map((coin) => ({
        ...coin,
        balance: balances?.[coin.token],
      }))
  }, [balances])

  return (
    <CoinsContext.Provider
      value={{
        isLoading,
        ethQuery,
        tokensQuery,
        pricesQuery,
        coins,
        allCoins,
        investmentCoins,
        stableCoins,
      }}
    >
      {children}
    </CoinsContext.Provider>
  )
}

export const useCoins = () => {
  const context = useContext(CoinsContext)
  if (!context) throw new Error('useCoins must be used within a CoinsProvider')
  return context
}

export const useCoin = (
  addressOrSymbol: allCoins[number]['symbol'] | allCoins[number]['token'] | undefined
) => {
  const meta = useCoins()
  const { allCoins, ...rest } = meta
  if (!addressOrSymbol) return { coin: undefined, ...rest }
  const coin =
    isAddress(addressOrSymbol) || addressOrSymbol === 'eth'
      ? allCoins.find((coin) => coin.token === addressOrSymbol)
      : allCoins.find((coin) => coin.symbol === addressOrSymbol)
  return { coin, ...rest }
}
