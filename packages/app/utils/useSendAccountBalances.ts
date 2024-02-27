import { baseMainnet, usdcAddress as usdcAddresses, sendAddress as sendAddresses } from '@my/wagmi'
import { UseBalanceReturnType, useBalance } from 'wagmi'
import { useSendAccounts } from './send-accounts'

export const useSendAccountBalances = () => {
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]

  const balances: {
    [key: string]: UseBalanceReturnType
  } = {}
  const tokens = [usdcAddresses[baseMainnet.id], sendAddresses[baseMainnet.id]]

  for (const token of tokens) {
    balances[token] = useBalance({
      address: sendAccount?.address,
      token,
      query: { enabled: !!sendAccount },
      chainId: baseMainnet.id,
    })
  }

  let totalBalance = 0n
  for (const token of tokens) {
    if (balances[token]?.isPending) {
      return { balances, undefined }
    }
    totalBalance += balances[token]?.data?.value ?? 0n
  }

  return { balances, totalBalance }
}
