import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
  sendAbi,
  usdcAbi,
} from '@my/wagmi'
import { useBalance, useReadContracts } from 'wagmi'
import { useSendAccounts } from './send-accounts'

const usdcBaseContract = {
  address: usdcAddresses[baseMainnet.id],
  abi: usdcAbi,
  chainId: baseMainnet.id,
} as const

const sendBaseContract = {
  address: sendAddresses[baseMainnet.id],
  abi: sendAbi,
  chainId: baseMainnet.id,
} as const

export const useSendAccountBalances = () => {
  const { data: sendAccounts } = useSendAccounts()
  const sendAccount = sendAccounts?.[0]

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

  return { balances }
}
