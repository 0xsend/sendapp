import { useReadUsdcAllowance, tokenPaymasterAddress } from '@my/wagmi'
import { parseUnits, type Address } from 'viem'

const MINIMUM_ALLOWANCE = parseUnits('100', 6) // 100 USDC

// Feature flag: chains where paymaster allowance check is enabled
const ENABLED_CHAIN_IDS = [
  84532, // Base Sepolia
] as const

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
  // Check if feature is enabled for this chain and chain has a paymaster configured
  const paymasterAddress = tokenPaymasterAddress[chainId as keyof typeof tokenPaymasterAddress]
  const isFeatureEnabled = ENABLED_CHAIN_IDS.includes(chainId as (typeof ENABLED_CHAIN_IDS)[number])
  const shouldCheck = isFeatureEnabled && !!paymasterAddress && !!sendAccount

  const {
    data: allowance,
    isLoading,
    error,
  } = useReadUsdcAllowance({
    chainId: chainId as keyof typeof tokenPaymasterAddress,
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
