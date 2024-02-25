import { mainnet, sendTokenAddress } from '@my/wagmi'
import { useBalance, useReadContract } from 'wagmi'

export const useSendBalance = (address?: `0x${string}`) => {
  return useBalance({
    address,
    token: sendTokenAddress[mainnet.id],
  })
}

export const useSendBalanceOfAt = ({
  address,
  snapshot,
}: {
  address?: `0x${string}`
  snapshot?: bigint
}) => {
  return useReadContract({
    abi: [
      {
        type: 'function',
        inputs: [
          { name: 'account', internalType: 'address', type: 'address' },
          { name: 'snapshotId', internalType: 'uint256', type: 'uint256' },
        ],
        name: 'balanceOfAt',
        outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'balanceOfAt',
    address: sendTokenAddress[mainnet.id],
    // biome-ignore lint/style/noNonNullAssertion: we know address and snapshot are defined when enabled is true
    args: [address!, snapshot!],
    query: {
      enabled: !!address && !!snapshot,
    },
  })
}
