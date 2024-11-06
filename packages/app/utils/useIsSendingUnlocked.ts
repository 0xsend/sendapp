import { coinsDict } from 'app/data/coins'
import { useSendAccount } from './send-accounts'
import { useSendAccountBalances } from './useSendAccountBalances'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { parseUnits } from 'viem'

export const useIsSendingUnlocked = () => {
  const minGasBalance = '0.05'
  const { data: sendAccount, isLoading: isLoadingSendAccount } = useSendAccount()
  const { balances, isLoading: isLoadingBalances } = useSendAccountBalances()
  const usdcBalance = balances?.USDC

  const isLoading = isLoadingBalances || isLoadingSendAccount
  const isUnlocked =
    !isLoading &&
    Boolean(sendAccount) &&
    usdcBalance !== undefined &&
    usdcBalance >= parseUnits(minGasBalance, coinsDict[usdcAddress[baseMainnet.id]].decimals)
  return { isSendingUnlocked: isUnlocked, isLoading }
}
