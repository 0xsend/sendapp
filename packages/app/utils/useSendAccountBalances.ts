import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
} from '@my/wagmi'
import { UseBalanceReturnType, useBalance } from 'wagmi'
import { useSendAccounts } from './send-accounts'
import { useEffect, useState } from 'react'

export const useSendAccountBalances = () => {
  const [tokenPrices, setTokenPrices] = useState<{ [key: string]: { usd: number } }>({})
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]

  const balances: {
    [key: string]: UseBalanceReturnType
  } = {}
  const tokens = [usdcAddresses[baseMainnet.id], 'eth', sendAddresses[baseMainnet.id]]

  for (const token of tokens) {
    balances[token] = useBalance({
      address: sendAccount?.address,
      token: token === 'eth' ? undefined : (token as `0x${string}`),
      query: { enabled: !!sendAccount },
      chainId: baseMainnet.id,
    })
  }

  useEffect(() => {
    const func = async () => {
      const res = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin,send-token&vs_currencies=usd'
      )
      const data = await res.json()
      setTokenPrices({
        USDC: data['usd-coin'],
        ETH: data.ethereum,
        send: data['send-token'],
      })
    }
    func()
  }, [])

  let totalBalance = 0
  for (const token of tokens) {
    if (balances[token]?.isPending) {
      return { balances, undefined }
    }
    const tokenPrice = tokenPrices[balances[token]?.data?.symbol as string]?.usd ?? 1
    totalBalance +=
      (Number(balances[token]?.data?.value ?? 0n) / 10 ** (balances[token]?.data?.decimals ?? 0)) *
      tokenPrice
  }

  return { balances, totalBalance }
}
