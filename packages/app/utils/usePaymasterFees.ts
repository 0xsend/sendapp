import { baseMainnet, entryPointAddress } from '@my/wagmi'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { api } from './api'
import type { UserOperation } from 'permissionless'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'

/**
 * Hook to get USDC fees for a user operation using the ERC-7677 paymaster.
 *
 * This replaces useUSDCFees and provides the total fee (gasFees + baseFee)
 * from the ERC-7677 paymaster's getPaymasterData method.
 *
 * @param userOp - The user operation to estimate fees for
 * @returns Query result with totalFee and decimals
 */
export function usePaymasterFees({
  userOp,
}: {
  userOp: UserOperation<'v0.7'> | undefined
}): UseQueryResult<{ totalFee: bigint; decimals: number }, Error> {
  const getPaymasterData = api.sendUSDCPaymaster.getPaymasterData.useMutation()

  return useQuery({
    queryKey: ['paymasterFees', { userOp }],
    enabled: !!userOp,
    queryFn: async () => {
      if (!userOp) {
        throw new Error('User operation is required')
      }

      const result = await getPaymasterData.mutateAsync({
        userOp: {
          sender: userOp.sender,
          nonce: userOp.nonce,
          callData: userOp.callData,
          callGasLimit: userOp.callGasLimit,
          verificationGasLimit: userOp.verificationGasLimit,
          preVerificationGas: userOp.preVerificationGas,
          maxFeePerGas: userOp.maxFeePerGas,
          maxPriorityFeePerGas: userOp.maxPriorityFeePerGas,
        },
        entryPoint: entryPointAddress[baseMainnet.id] ?? ENTRYPOINT_ADDRESS_V07,
      })

      return {
        totalFee: BigInt(result.tokenPayment.maxFee),
        decimals: result.tokenPayment.decimals,
      }
    },
  })
}
