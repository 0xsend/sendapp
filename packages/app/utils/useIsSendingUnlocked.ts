import { useSendAccount } from './send-accounts'
import { parseUnits } from 'viem'
import { useCoin } from 'app/provider/coins'

export const useIsSendingUnlocked = () => {
  const minGasBalance = '0.05'
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()

  const { coin: usdc, isLoading: isCoinLoading } = useCoin('USDC')

  const isLoading = isCoinLoading || isLoadingSendAccount
  const isUnlocked =
    !isLoading &&
    usdc &&
    Boolean(sendAccount) &&
    usdc.balance &&
    usdc.decimals &&
    usdc.balance >= parseUnits(minGasBalance, usdc.decimals)
  return { isSendingUnlocked: isUnlocked, isLoading }
}
