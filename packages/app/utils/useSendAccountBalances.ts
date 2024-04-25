import {
  baseMainnet,
  usdcAddress as usdcAddresses,
  sendTokenAddress as sendAddresses,
  sendTokenAbi,
  usdcAbi,
} from '@my/wagmi'
import { useAccount, useBalance, useReadContracts } from 'wagmi'
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

export const useSendAccountBalances = ({
  useConnectedWallet,
}: { useConnectedWallet?: boolean } = {}) => {
  const { data: tokenPrices } = useTokenPrices()
  // const { data: sendAccounts } = useSendAccounts()
  // const sendAccount = sendAccounts?.[0]
  const { data: chainAddresses } = useChainAddresses()
  const { address: wagmiAddress } = useAccount()
  const sendAccount = useConnectedWallet ? wagmiAddress : chainAddresses?.[0]?.address

  const { data: tokenBalances, isPending: isPendingTokenBalances } = useReadContracts({
    query: { enabled: !!sendAccount },
    contracts: [
      {
        ...usdcBaseContract,
        functionName: 'balanceOf',
        args: sendAccount && [sendAccount],
      },
      {
        ...sendBaseContract,
        functionName: 'balanceOf',
        args: sendAccount && [sendAccount],
      },
    ],
  })

  const { data: ethBalanceOnBase, isPending: isPendingEthBalanceOnBase } = useBalance({
    address: sendAccount,
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
    return { balances, totalBalance: undefined }
  }
  const usdcBalanceInUsd =
    (Number(tokenBalances?.[0].result ?? 0n) / 10 ** 6) * tokenPrices['usd-coin'].usd
  const sendBalanceInUsd = Number(tokenBalances?.[1].result ?? 0n) * tokenPrices['send-token'].usd
  const ethBalanceInUsd =
    (Number(ethBalanceOnBase?.value ?? 0n) / 10 ** 18) * tokenPrices.ethereum.usd
  const totalBalance = usdcBalanceInUsd + sendBalanceInUsd + ethBalanceInUsd

  return { balances, totalBalance, isPending }
}
