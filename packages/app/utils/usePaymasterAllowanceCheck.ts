import { useReadUsdcAllowance, tokenPaymasterAddress } from '@my/wagmi'
import { parseUnits, type Address } from 'viem'

const BASE_SEPOLIA_CHAIN_ID = 84532
const MINIMUM_ALLOWANCE = parseUnits('100', 6) // 100 USDC

interface UsePaymasterAllowanceCheckParams {
  chainId: number
  sendAccount: Address | undefined
}

interface UsePaymasterAllowanceCheckReturn {
  needsApproval: boolean
  isLoading: boolean
  error: Error | null
  targetAmount: bigint
  currentAllowance: bigint | undefined
}

export function usePaymasterAllowanceCheck({
  chainId,
  sendAccount,
}: UsePaymasterAllowanceCheckParams): UsePaymasterAllowanceCheckReturn {
  // Short-circuit on non-Base Sepolia or missing account
  const isBaseSepolia = chainId === BASE_SEPOLIA_CHAIN_ID
  const shouldCheck = isBaseSepolia && !!sendAccount

  const paymasterAddress = tokenPaymasterAddress[BASE_SEPOLIA_CHAIN_ID]

  const {
    data: allowance,
    isLoading,
    error,
  } = useReadUsdcAllowance({
    chainId: BASE_SEPOLIA_CHAIN_ID,
    args: sendAccount && paymasterAddress ? [sendAccount, paymasterAddress] : undefined,
    query: {
      enabled: shouldCheck,
    },
  })

  const needsApproval = shouldCheck && !isLoading && (allowance ?? 0n) < MINIMUM_ALLOWANCE

  return {
    needsApproval,
    isLoading,
    error: error as Error | null,
    targetAmount: MINIMUM_ALLOWANCE,
    currentAllowance: allowance,
  }
}
