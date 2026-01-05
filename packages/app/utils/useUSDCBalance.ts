import { baseMainnet, erc20Abi } from '@my/wagmi'
import { useReadContract } from 'wagmi'
import { useSendAccount } from './send-accounts'
import { usdcCoin } from '../data/coins'
import { useMemo } from 'react'

/**
 * @returns The USDC balance in dollars, or 0 if not available
 */
export const useUSDCBalance = () => {
  const { data: sendAccount } = useSendAccount()

  const usdcBalanceQuery = useReadContract({
    address: usdcCoin.token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: sendAccount?.address ? [sendAccount.address] : undefined,
    chainId: baseMainnet.id,
    query: {
      enabled: !!sendAccount?.address,
      refetchInterval: 10 * 1000,
    },
  })

  const dollarBalance = useMemo(() => {
    if (!usdcBalanceQuery.data) return 0
    // USDC has 6 decimals, and price is always $1
    const balance = Number(usdcBalanceQuery.data.toString())
    const decimals = 10 ** usdcCoin.decimals
    return balance / decimals
  }, [usdcBalanceQuery.data])

  return {
    balance: dollarBalance,
    isLoading: usdcBalanceQuery.isLoading,
  }
}
