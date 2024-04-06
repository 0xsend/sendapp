import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
  sendTokenAbi,
  usdcAbi,
} from '@my/wagmi'
import { useBalance, useReadContracts } from 'wagmi'
import { useTokenPrices } from './useTokenPrices'
// import { useSendAccounts } from './send-accounts'
import { useChainAddresses } from './useChainAddresses'

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
  // const { data: sendAccounts } = useSendAccounts()
  // const sendAccount = sendAccounts?.[0]
  const { data: chainAddresses } = useChainAddresses()
  const sendAccount = chainAddresses?.[0]

  //@todo this is improper use of a hook. Hooks should always be used at top level of component
  const { data: tokenBalances, isPending: isPendingTokenBalances } = useReadContracts({
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
  const { data: ethBalanceOnBase, isPending: isPendingEthBalanceOnBase } = useBalance({
    address: sendAccount?.address,
    query: { enabled: !!sendAccount },
    chainId: baseMainnet.id,
  })

  const isPending = isPendingTokenBalances || isPendingEthBalanceOnBase
  const balances = isPending
    ? undefined
    : {
        eth: ethBalanceOnBase,
        ...tokenBalances,
      }

  if (!tokenPrices) {
    return { balances, undefined }
  }
  const usdcBalanceInUsd =
    (Number(tokenBalances?.[0].result ?? 0n) / 10 ** 6) * tokenPrices['usd-coin'].usd
  const sendBalanceInUsd = Number(tokenBalances?.[1].result ?? 0n) * tokenPrices['send-token'].usd
  const ethBalanceInUsd =
    (Number(ethBalanceOnBase?.value ?? 0n) / 10 ** 18) * tokenPrices.ethereum.usd
  const totalBalance = usdcBalanceInUsd + sendBalanceInUsd + ethBalanceInUsd

  return { balances, totalBalance }
}
