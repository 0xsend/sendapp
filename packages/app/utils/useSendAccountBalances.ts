import { baseMainnet, usdcAddress as usdcAddresses, sendAddress as sendAddresses } from '@my/wagmi'
import { UseBalanceReturnType, useBalance } from 'wagmi'
import { useSendAccounts } from './send-accounts'

export const useSendAccountBalances = (address?: `0x${string}`) => {
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

  const totalBalance = () => {
    let total = 0
    for (const token of tokens) {
      const tokenBalance = parseFloat(balances[token]?.data?.formatted ?? '0')
      total += tokenBalance
    }
    return total
  }

  return { balances, totalBalance }
}
