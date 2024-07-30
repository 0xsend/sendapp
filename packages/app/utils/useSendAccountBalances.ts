import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
  sendTokenAbi,
  usdcAbi,
} from '@my/wagmi'
import { useBalance, useReadContracts } from 'wagmi'
import { useSendAccount } from './send-accounts'
import { useTokenPrices } from './useTokenPrices'

const usdcBaseContract = {
  address: usdcAddresses[baseMainnet.id],
  abi: usdcAbi,
  chainId: baseMainnet.id,
} as const

const sendBaseContract = {
  address: sendAddresses[baseMainnet.id],
  abi: sendTokenAbi,
  chainId: baseMainnet.id,
} as const

export const useSendAccountBalances = () => {
  const { data: tokenPrices } = useTokenPrices()
  const { data: sendAccount } = useSendAccount()

  const { data: tokenBalances, isPending: isLoadingTokenBalances } = useReadContracts({
    query: { enabled: !!sendAccount },
    contracts: [
      {
        ...usdcBaseContract,
        functionName: 'balanceOf',
        args: sendAccount?.address && [sendAccount?.address],
      },
      {
        ...sendBaseContract,
        functionName: 'balanceOf',
        args: sendAccount?.address && [sendAccount?.address],
      },
    ],
  })

  const { data: ethBalanceOnBase, isLoading: isLoadingEthBalanceOnBase } = useBalance({
    address: sendAccount?.address,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  const isLoading = isLoadingTokenBalances || isLoadingEthBalanceOnBase
  const balances = isLoading
    ? undefined
    : {
        eth: ethBalanceOnBase,
        ...tokenBalances,
      }

  if (!tokenPrices) {
    return { balances, totalBalance: undefined }
  }
  const usdcBalanceInUsd =
    (Number(tokenBalances?.[0].result ?? 0n) / 10 ** 6) * tokenPrices['usd-coin'].usd
  const sendBalanceInUsd = Number(tokenBalances?.[1].result ?? 0n) * tokenPrices['send-token'].usd
  const ethBalanceInUsd =
    (Number(ethBalanceOnBase?.value ?? 0n) / 10 ** 18) * tokenPrices.ethereum.usd
  const totalBalance = usdcBalanceInUsd + sendBalanceInUsd + ethBalanceInUsd

  return { balances, totalBalance, isLoading }
}
