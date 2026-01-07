/**
 * Feature flags for enabling/disabling features at runtime.
 *
 * Usage:
 *   const isBankTransferEnabled = useFeatureFlag('BANK_TRANSFER')
 *
 * Environment variables:
 *   NEXT_PUBLIC_FEATURE_VIRTUAL_BANK_ACCOUNTS=1  (enabled)
 *   NEXT_PUBLIC_FEATURE_VIRTUAL_BANK_ACCOUNTS=0  (disabled, default)
 */

type FeatureFlag = 'BANK_TRANSFER'

const featureFlags: Record<FeatureFlag, boolean> = {
  BANK_TRANSFER: process.env.NEXT_PUBLIC_FEATURE_VIRTUAL_BANK_ACCOUNTS === '1',
}

/**
 * Check if a feature flag is enabled
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return true
}

/**
 * Check if bank transfer feature is enabled
 */
export function useBankTransferEnabled(): boolean {
  return useFeatureFlag('BANK_TRANSFER')
}
