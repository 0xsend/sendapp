import { baseMainnet } from '@my/wagmi'
import { useBalance } from 'wagmi'
import { useSendAccount } from './send-accounts'
import { useTokenPrices } from './useTokenPrices'
import { convertBalanceToFiat } from './convertBalanceToUSD'
import { allCoins, ethCoin } from '../data/coins'
import { useMemo } from 'react'
import type { Address } from 'viem'
import { useSupabase } from './supabase/useSupabase'
import { useQuery } from '@tanstack/react-query'

/**
 * Hook to get Send account balances from database
 *
 * This hook queries the erc20_balances table which is kept up-to-date
 * via triggers on send_account_transfers. No RPC calls needed!
 */
export const useSendAccountBalances = () => {
  const pricesQuery = useTokenPrices()
  const { data: sendAccount } = useSendAccount()
  const supabase = useSupabase()

  // Still need ETH balance from RPC (not an ERC20)
  const ethQuery = useBalance({
    address: sendAccount?.address,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  // Query ERC20 balances from database
  const dbBalancesQuery = useQuery({
    queryKey: ['erc20-balances', baseMainnet.id, sendAccount],
    queryFn: async () => {
      if (!sendAccount) return null

      // Convert address to bytea format for query
      const addressBytes = sendAccount.address.toLowerCase().slice(2)

      const { data, error } = await supabase
        .from('erc20_balances')
        .select(`
          token_address,
          balance,
          last_updated_time,
          erc20_tokens!inner(
            name,
            symbol,
            decimals
          )
        `)
        .eq('send_account_address', `\\x${addressBytes}`)
        .eq('chain_id', baseMainnet.id)
        .gt('balance', '0')

      if (error) {
        console.error('Failed to fetch balances from database:', error)
        throw error
      }

      return data
    },
    enabled: !!sendAccount,
    staleTime: 30 * 1000, // Cache for 30 seconds (balances update via trigger)
    refetchInterval: 30 * 1000, // Refresh every 30 seconds (much less than 10s RPC polling!)
  })

  const isLoading = ethQuery.isLoading || dbBalancesQuery.isLoading

  // Combine ETH and ERC20 balances
  const balances = useMemo(() => {
    if (isLoading || !dbBalancesQuery.data) return undefined

    const result: Record<string, bigint | undefined> = {}

    // Add ETH balance
    result[ethCoin.symbol] = ethQuery.data?.value

    // Add ERC20 balances from database
    for (const item of dbBalancesQuery.data) {
      const tokenAddr = `0x${Buffer.from(item.token_address).toString('hex')}` as Address
      result[tokenAddr] = BigInt(item.balance)

      // Also add by symbol for backwards compatibility
      if (item.erc20_tokens?.symbol) {
        result[item.erc20_tokens.symbol] = BigInt(item.balance)
      }
    }

    // Fill in zero balances for known coins that weren't found
    // (for backwards compatibility with components expecting all allCoins)
    for (const coin of allCoins) {
      if (coin.token !== 'eth' && !result[coin.token]) {
        result[coin.token] = 0n
        result[coin.symbol] = 0n
      }
    }

    return result
  }, [isLoading, ethQuery.data?.value, dbBalancesQuery.data])

  // Calculate dollar values
  const dollarBalances = useMemo(() => {
    const { data: tokenPrices } = pricesQuery
    const { data: ethBalance } = ethQuery
    if (!tokenPrices || !balances) return undefined

    // Add ETH dollar value
    const result: Record<Address | 'eth', number> = {
      eth:
        convertBalanceToFiat({ ...ethCoin, balance: ethBalance?.value ?? 0n }, tokenPrices.eth) ??
        0,
    }

    // Add ERC20 dollar values
    if (dbBalancesQuery.data) {
      for (const item of dbBalancesQuery.data) {
        const tokenAddr = `0x${Buffer.from(item.token_address).toString('hex')}` as Address
        const balance = BigInt(item.balance)

        // Find matching coin definition for decimals
        const coin = allCoins.find((c) => c.token === tokenAddr)
        if (coin && coin.token !== 'eth') {
          // Always use $1 for USDC regardless of market price
          const price = coin.symbol === 'USDC' ? 1 : tokenPrices[tokenAddr]
          result[tokenAddr] = convertBalanceToFiat({ ...coin, balance }, price) ?? 0
        }
      }
    }

    // Fill in zeros for known coins
    for (const coin of allCoins) {
      if (coin.token !== 'eth' && !result[coin.token]) {
        result[coin.token] = 0
      }
    }

    return result
  }, [pricesQuery, ethQuery, balances, dbBalancesQuery.data])

  return {
    balances,
    isLoading,
    dollarBalances,
    ethQuery,
    tokensQuery: {
      ...dbBalancesQuery,
      queryKey: ['erc20-balances', baseMainnet.id, sendAccount] as const,
    }, // Renamed for backwards compatibility, added queryKey for invalidation
    pricesQuery,
    // New: expose raw database data for components that want full token info
    tokens: dbBalancesQuery.data?.map((item) => ({
      address: `0x${Buffer.from(item.token_address).toString('hex')}` as Address,
      balance: BigInt(item.balance),
      name: item.erc20_tokens?.name,
      symbol: item.erc20_tokens?.symbol,
      decimals: item.erc20_tokens?.decimals,
      lastUpdated: item.last_updated_time,
    })),
  }
}
