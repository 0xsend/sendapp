import { useQueryClient } from '@tanstack/react-query'
import type { erc20Coin } from 'app/data/coins'
import { useSendAccount } from 'app/utils/send-accounts'
import { createContext, useContext, useMemo, useCallback, type ReactNode } from 'react'
import { isAddressEqual } from 'viem'
import type { UseQueryReturnType } from 'wagmi/query'
import {
  useMyAffiliateRewards,
  useMyAffiliateRewardsBalance,
  useSendEarnBalances,
  useUnderlyingVaultsAsset,
  useVaultConvertSharesToAssets,
  type SendEarnBalance,
} from '../hooks'

type SendEarnCoinBalance = {
  log_addr: `0x${string}`
  owner: `0x${string}`
  assets: bigint
  shares: bigint
  coin: erc20Coin
  currentAssets: bigint
}

type SendEarnContextType = {
  // All balances
  allBalances: UseQueryReturnType<SendEarnBalance[]>

  // Coin-specific methods
  getCoinBalances: (coin: erc20Coin | undefined) => {
    data: SendEarnCoinBalance[] | undefined
    isLoading: boolean
    isSuccess: boolean
    error: Error | null
  }

  // Total values for all assets (direct values instead of function)
  totalAssets: {
    vaults: `0x${string}`[]
    shares: bigint[]
    currentAssets: UseQueryReturnType<bigint[] | undefined>
    totalCurrentValue: bigint
  }

  // Affiliate rewards
  affiliateRewards: UseQueryReturnType<
    | {
        shares: bigint
        assets: bigint
        vault: {
          affiliate: `0x${string}`
          send_earn_affiliate: `0x${string}`
          send_earn_affiliate_vault: { send_earn: `0x${string}`; log_addr: `0x${string}` } | null
        } | null
      }
    | null
    | undefined
  >
  affiliateRewardsBalance: UseQueryReturnType<bigint | null | undefined>

  // Loading states
  isLoading: boolean

  // Invalidation helper
  invalidateQueries: () => void
}

const SendEarnContext = createContext<SendEarnContextType | undefined>(undefined)

export function SendEarnProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const sendAccount = useSendAccount()

  // Core data fetching
  const allBalances = useSendEarnBalances()

  // Get all vaults with balances for asset conversion
  const balancesWithShares = useMemo(() => {
    return allBalances?.data?.filter((b) => b.shares > 0n) ?? []
  }, [allBalances.data])

  const vaultsWithBalance = useMemo(() => {
    return balancesWithShares.map((b) => b.log_addr)
  }, [balancesWithShares])

  const sharesWithBalance = useMemo(() => {
    return balancesWithShares.map((b) => b.shares)
  }, [balancesWithShares])

  // Fetch underlying vault assets (cache with high staleTime since assets rarely change)
  const vaultAssets = useUnderlyingVaultsAsset(vaultsWithBalance)

  // Convert all shares to current asset values
  const allCurrentAssets = useVaultConvertSharesToAssets({
    vaults: vaultsWithBalance,
    shares: sharesWithBalance,
  })

  // Affiliate data
  const affiliateRewards = useMyAffiliateRewards()
  const affiliateRewardsBalance = useMyAffiliateRewardsBalance()

  // Calculate total current value across all vaults
  const totalCurrentValue = useMemo(() => {
    return allCurrentAssets.data?.reduce((sum, assets) => sum + assets, 0n) ?? 0n
  }, [allCurrentAssets.data])

  // Function to get balances for a specific coin
  const getCoinBalances = useCallback(
    (coin: erc20Coin | undefined) => {
      if (!coin?.token || !allBalances.data || !vaultAssets.data || !allCurrentAssets.data) {
        return {
          data: undefined,
          isLoading: allBalances.isLoading || vaultAssets.isLoading || allCurrentAssets.isLoading,
          isSuccess: false,
          error: allBalances.error || vaultAssets.error || allCurrentAssets.error,
        }
      }

      // Filter balances for the specific coin
      const coinBalances: SendEarnCoinBalance[] = []

      balancesWithShares.forEach((balance, i) => {
        const vaultAsset = vaultAssets.data?.[i]
        const currentAssets = allCurrentAssets.data?.[i]

        if (vaultAsset && currentAssets !== undefined && isAddressEqual(vaultAsset, coin.token)) {
          coinBalances.push({
            log_addr: balance.log_addr,
            owner: balance.owner,
            assets: balance.assets,
            shares: balance.shares,
            coin,
            currentAssets,
          })
        }
      })

      return {
        data: coinBalances,
        isLoading: false,
        isSuccess: true,
        error: null,
      }
    },
    [
      allBalances.data,
      vaultAssets.data,
      allCurrentAssets.data,
      balancesWithShares,
      allBalances.isLoading,
      vaultAssets.isLoading,
      allCurrentAssets.isLoading,
      allBalances.error,
      vaultAssets.error,
      allCurrentAssets.error,
    ]
  )

  // Total assets across all vaults (memoized object instead of function)
  const totalAssets = useMemo(
    () => ({
      vaults: vaultsWithBalance,
      shares: sharesWithBalance,
      currentAssets: allCurrentAssets,
      totalCurrentValue,
    }),
    [vaultsWithBalance, sharesWithBalance, allCurrentAssets, totalCurrentValue]
  )

  // Overall loading state
  const isLoading = sendAccount.isLoading || allBalances.isLoading

  // Function to invalidate all related queries
  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['send_earn_balances'] })
    queryClient.invalidateQueries({ queryKey: ['sendEarnCoinBalances'] })
    queryClient.invalidateQueries({ queryKey: ['vaultConvertSharesToAssets'] })
    queryClient.invalidateQueries({ queryKey: ['myEarnRewards'] })
    queryClient.invalidateQueries({ queryKey: ['myAffiliateVault'] })
  }, [queryClient])

  const contextValue = useMemo(
    (): SendEarnContextType => ({
      allBalances,
      getCoinBalances,
      totalAssets,
      affiliateRewards,
      affiliateRewardsBalance,
      isLoading,
      invalidateQueries,
    }),
    [
      allBalances,
      getCoinBalances,
      totalAssets,
      affiliateRewards,
      affiliateRewardsBalance,
      isLoading,
      invalidateQueries,
    ]
  )

  return <SendEarnContext.Provider value={contextValue}>{children}</SendEarnContext.Provider>
}

export const useSendEarn = () => {
  const context = useContext(SendEarnContext)
  if (!context) {
    throw new Error('useSendEarn must be used within a SendEarnProvider')
  }
  return context
}

// Convenience hook for getting coin-specific data
export const useSendEarnCoin = (coin: erc20Coin | undefined) => {
  const context = useSendEarn()
  const coinBalances = context.getCoinBalances(coin)

  return {
    ...context,
    coinBalances,
  }
}
