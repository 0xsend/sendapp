import {
  baseMainnet,
  entryPointAddress,
  sendAccountAbi,
  type entryPointAddress as EntryPointAddressType,
} from '@my/wagmi'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { api } from './api'
import type { UserOperation } from 'permissionless'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'
import { useAccountNonce } from './userop'
import { useEstimateFeesPerGas } from 'wagmi'
import { encodeFunctionData, type Address, type Hex } from 'viem'
import { useMemo } from 'react'
import { sendBaseMainnetBundlerClient } from '@my/wagmi'
import { assert } from './assert'
import { throwIf } from './throwIf'
import { throwNiceError } from './userop'
import debug from 'debug'

const log = debug('app:utils:useUserOpWithPaymaster')

export type SendAccountCall = {
  dest: `0x${string}`
  value: bigint
  data: `0x${string}`
}

export type UseUserOpWithPaymasterResult = {
  userOp: UserOperation<'v0.7'>
  fees?: {
    totalFee: bigint
    decimals: number
  }
}

/**
 * Hook to prepare a complete UserOperation with ERC-7677 paymaster data and fee information.
 *
 * This hook follows the full ERC-7677 flow:
 * 1. Gets paymaster stub data for gas estimation
 * 2. Estimates gas with stub data
 * 3. Gets final paymaster data with gas estimates
 * 4. Returns complete userOp + fee information (or no fees if sponsored)
 *
 * This replaces the need for separate useUserOp + usePaymasterFees calls.
 *
 * @param sender - The sender address
 * @param calls - The calls to execute
 * @param sponsored - Whether to use sponsored gas (default: false)
 * @returns Query result with complete userOp and optional fee information
 */
export function useUserOpWithPaymaster({
  sender,
  calls,
  sponsored = false,
  chainId = baseMainnet.id,
}: {
  sender: Address | undefined
  calls: SendAccountCall[] | undefined
  sponsored?: boolean
  chainId?: keyof typeof EntryPointAddressType
}): UseQueryResult<UseUserOpWithPaymasterResult, Error> {
  const { data: nonce, error: nonceError, isLoading: isLoadingNonce } = useAccountNonce({ sender })
  const {
    data: feesPerGas,
    error: gasFeesError,
    isLoading: isLoadingFeesPerGas,
  } = useEstimateFeesPerGas({
    chainId,
    query: {
      refetchInterval: 1000 * 60 * 1, // refetch every minute
    },
  })

  // Choose paymaster based on sponsored flag
  const getPaymasterStubData = sponsored
    ? api.sponsoredPaymaster.getPaymasterStubData.useMutation()
    : api.send7677Paymaster.getPaymasterStubData.useMutation()
  const getPaymasterData = sponsored
    ? api.sponsoredPaymaster.getPaymasterData.useMutation()
    : api.send7677Paymaster.getPaymasterData.useMutation()

  const enabled =
    sender !== undefined &&
    nonce !== undefined &&
    calls !== undefined &&
    !isLoadingNonce &&
    !isLoadingFeesPerGas

  const { maxFeePerGas, maxPriorityFeePerGas } = feesPerGas ?? {}

  const queryKey = useMemo(
    () => [
      'userOpWithPaymaster',
      {
        sender,
        nonce: nonce?.toString(),
        calls: calls?.map((c) => ({ dest: c.dest, value: c.value.toString(), data: c.data })),
        maxFeePerGas: maxFeePerGas?.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas?.toString(),
        sponsored,
        chainId,
      },
    ],
    [sender, nonce, calls, maxFeePerGas, maxPriorityFeePerGas, sponsored, chainId]
  )

  // Error states (gasFeesError, nonceError) are intentionally excluded from queryKey
  // as they don't affect cache invalidation - only the actual data inputs should
  return useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey,
    enabled,
    queryFn: async () => {
      throwIf(gasFeesError)
      throwIf(nonceError)
      assert(sender !== undefined, 'No sender found')
      assert(nonce !== undefined, 'No nonce found')
      assert(calls !== undefined, 'No calls found')
      assert(maxFeePerGas !== undefined, 'No max fee per gas found')
      assert(maxPriorityFeePerGas !== undefined, 'No max priority fee per gas found')

      log('Starting ERC-7677 flow', { sender, nonce, calls })

      const callData = encodeFunctionData({
        abi: sendAccountAbi,
        functionName: 'executeBatch',
        args: [calls],
      })

      const entryPoint = entryPointAddress[chainId] ?? ENTRYPOINT_ADDRESS_V07

      // Step 1: Get paymaster stub data for gas estimation
      log('Step 1: Getting paymaster stub data...', { sponsored })
      const stubResult = await getPaymasterStubData.mutateAsync({
        userOp: {
          sender,
          nonce,
          callData,
          callGasLimit: 0n,
          verificationGasLimit: 0n,
          preVerificationGas: 0n,
          maxFeePerGas,
          maxPriorityFeePerGas,
        },
        entryPoint,
        ...(sponsored && { sendAccountCalls: calls }),
      })

      log('Stub data received:', stubResult)

      // Step 2: Estimate gas with stub data
      log('Step 2: Estimating gas...')
      const userOpWithStub: UserOperation<'v0.7'> = {
        sender,
        nonce,
        callData,
        maxFeePerGas,
        maxPriorityFeePerGas,
        signature: '0x',
        callGasLimit: 0n,
        verificationGasLimit: 0n,
        preVerificationGas: 0n,
        paymaster: stubResult.paymasterAndData.slice(0, 42) as Hex,
        paymasterVerificationGasLimit: stubResult.paymasterVerificationGasLimit,
        paymasterPostOpGasLimit: stubResult.paymasterPostOpGasLimit,
        paymasterData: `0x${stubResult.paymasterAndData.slice(106)}` as Hex,
      }

      let gasEstimates: {
        callGasLimit: bigint
        verificationGasLimit: bigint
        preVerificationGas: bigint
      }

      try {
        gasEstimates = await sendBaseMainnetBundlerClient.estimateUserOperationGas({
          userOperation: userOpWithStub,
        })
        log('Gas estimates:', gasEstimates)
      } catch (e) {
        log('Gas estimation failed:', e)
        throwNiceError(e as Error & { cause?: Error })
      }

      // Step 3: Get final paymaster data with gas estimates
      log('Step 3: Getting final paymaster data...', { sponsored })
      const finalResult = await getPaymasterData.mutateAsync({
        userOp: {
          sender,
          nonce,
          callData,
          callGasLimit: gasEstimates.callGasLimit,
          verificationGasLimit: gasEstimates.verificationGasLimit,
          preVerificationGas: gasEstimates.preVerificationGas,
          maxFeePerGas,
          maxPriorityFeePerGas,
        },
        entryPoint,
        ...(sponsored && { sendAccountCalls: calls }),
      })

      log('Final paymaster data received:', finalResult)

      // Step 4: Construct complete userOp
      const completeUserOp: UserOperation<'v0.7'> = {
        sender,
        nonce,
        callData,
        callGasLimit: gasEstimates.callGasLimit,
        verificationGasLimit: gasEstimates.verificationGasLimit,
        preVerificationGas: gasEstimates.preVerificationGas,
        maxFeePerGas,
        maxPriorityFeePerGas,
        signature: '0x',
        paymaster: finalResult.paymasterAndData.slice(0, 42) as Hex,
        paymasterVerificationGasLimit: finalResult.paymasterVerificationGasLimit,
        paymasterPostOpGasLimit: finalResult.paymasterPostOpGasLimit,
        paymasterData: `0x${finalResult.paymasterAndData.slice(106)}` as Hex,
      }

      log('Complete userOp:', completeUserOp)

      return {
        userOp: completeUserOp,
        ...(sponsored
          ? {}
          : 'tokenPayment' in finalResult
            ? {
                fees: {
                  totalFee: BigInt(finalResult.tokenPayment.maxFee),
                  decimals: finalResult.tokenPayment.decimals,
                },
              }
            : {}),
      }
    },
  })
}
