import { createContext, useContext, useMemo } from 'react'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import type { CoinWithBalance } from 'app/data/coins'
import { coins as coinsOg, partnerCoins } from 'app/data/coins'
import { Spinner } from '@my/ui'

type CoinsContextType = {
  coins: CoinWithBalance[]
  isLoading: boolean
  totalBalance: number | undefined
  isLoadingTotalBalance: boolean
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

  if (balanceData.isLoading) {
    return <Spinner />
  }

  return <CoinsContext.Provider value={{ ...balanceData, coins }}>{children}</CoinsContext.Provider>
}

export const useCoins = () => {
  const context = useContext(CoinsContext)
  if (!context) throw new Error('useCoins must be used within a CoinsProvider')
  return context
}
