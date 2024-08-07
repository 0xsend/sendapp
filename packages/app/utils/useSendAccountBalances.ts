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
import { convertBalanceToFiat } from './convertBalanceToUSD'

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
    convertBalanceToFiat(
      usdcBaseContract.address,
      tokenBalances?.[0].result ?? 0n,
      tokenPrices['usd-coin'].usd
    ) ?? 0

  const sendBalanceInUsd =
    convertBalanceToFiat(
      sendBaseContract.address,
      tokenBalances?.[1].result ?? 0n,
      tokenPrices['send-token'].usd
    ) ?? 0

  const ethBalanceInUsd =
    convertBalanceToFiat('eth', ethBalanceOnBase?.value ?? 0n, tokenPrices.ethereum.usd) ?? 0

  const totalBalance = usdcBalanceInUsd + sendBalanceInUsd + ethBalanceInUsd

  return { balances, totalBalance, isLoading }
}
