import { sendABI, sendAddress } from '@my/wagmi'
import { useBalance, useChainId, useContractRead } from 'wagmi'

export const useSendBalance = (address?: `0x${string}`) => {
  const chainId = useChainId() as keyof typeof sendAddress
  return useBalance({
    watch: true,
    address,
    token: sendAddress[chainId],
  })
}

export const useSendBalanceOfAt = ({
  address,
  snapshot,
}: {
  address?: `0x${string}`
  snapshot?: bigint
}) => {
  const chainId = useChainId() as keyof typeof sendAddress
  return useContractRead({
    abi: sendABI,
    functionName: 'balanceOfAt',
    address: sendAddress[chainId],
    args: [address!, snapshot!],
    enabled: !!address && !!snapshot,
  })
}
