import { useSendAccount } from './send-accounts'
import { parseUnits } from 'viem'
import { useCoins } from 'app/provider/coins'

export const useIsSendingUnlocked = () => {
  const minGasBalance = '0.05'
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()
  const { coins, isLoading: isLoadingBalances } = useCoins()
  const usdc = coins.find((coin) => coin.symbol === 'USDC')

  const isLoading = isLoadingBalances || isLoadingSendAccount
  const isUnlocked =
    usdc &&
    !isLoading &&
    Boolean(sendAccount) &&
    usdc.balance !== undefined &&
    usdc.balance >= parseUnits(minGasBalance, usdc.decimals)
  return { isSendingUnlocked: isUnlocked, isLoading }
}
