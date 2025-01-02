import { createContext, useContext, useMemo } from 'react'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import type { allCoins, CoinWithBalance } from 'app/data/coins'
import { coins as coinsOg, partnerCoins } from 'app/data/coins'
import { isAddress } from 'viem'
import type { TokenPricesSchema } from 'app/utils/useTokenPrices'
import type { UseQueryResult } from '@tanstack/react-query'
import type { z } from 'zod'
import type { UseBalanceReturnType, UseReadContractsReturnType } from 'wagmi'

type CoinsContextType = {
  coins: CoinWithBalance[]
  isLoading: boolean
  totalPrice: number | undefined
  ethQuery: UseBalanceReturnType
  tokensQuery: UseReadContractsReturnType
  pricesQuery: UseQueryResult<z.infer<typeof TokenPricesSchema>, Error>
}

const CoinsContext = createContext<CoinsContextType | undefined>(undefined)

export function CoinsProvider({ children }: { children: React.ReactNode }) {
  const balanceData = useSendAccountBalances()

  const coins = useMemo(() => {
    const { balances } = balanceData

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
        const balance = balances[coin.token]
        return balance !== undefined && balance > 0n
      })
      .map((coin) => ({
        ...coin,
        balance: balances[coin.token],
      }))

    return [...coinsWithBalances, ...activePartnerCoins]
  }, [balanceData])

  return <CoinsContext.Provider value={{ ...balanceData, coins }}>{children}</CoinsContext.Provider>
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
  const { coins, ...rest } = meta
  if (!addressOrSymbol) return { coin: undefined, ...rest }
  const coin =
    isAddress(addressOrSymbol) || addressOrSymbol === 'eth'
      ? coins.find((coin) => coin.token === addressOrSymbol)
      : coins.find((coin) => coin.symbol === addressOrSymbol)
  if (!coin) throw new Error(`Coin not found for ${addressOrSymbol}`)
  return { coin, ...rest }
}
