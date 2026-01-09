import { useEffect, useState } from 'react'
import { analytics } from 'app/analytics'

/**
 * Feature flags for enabling/disabling features at runtime.
 *
 * Usage:
 *   const isEnabled = useFeatureFlag('bridge_virtual_bank_account')
 *
 * Local overrides (useful for localnet/dev without PostHog):
 *   NEXT_PUBLIC_FEATURE_FLAGS='{"bridge_virtual_bank_account": true}'
 *
 */

const FEATURE_FLAGS = ['bridge_virtual_bank_account'] as const

type FeatureFlag = (typeof FEATURE_FLAGS)[number]
type FeatureFlagValue = boolean | string

const LOCAL_OVERRIDE_RAW = process.env.NEXT_PUBLIC_FEATURE_FLAGS
const LOCAL_OVERRIDES = parseLocalOverrides(LOCAL_OVERRIDE_RAW)

function parseLocalOverrides(raw?: string): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

function normalizeOverrideValue(value: unknown): FeatureFlagValue | undefined {
  if (value === undefined || value === null) return undefined

  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === '') return undefined
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false
    return value
  }

  return undefined
}

function coerceBooleanFlag(value: FeatureFlagValue | undefined): boolean | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim().length > 0
  return undefined
}

function getLocalOverride(flag: FeatureFlag): FeatureFlagValue | undefined {
  const override = LOCAL_OVERRIDES?.[flag] as FeatureFlagValue | undefined
  return normalizeOverrideValue(override)
}

/**
 * Check if a feature flag is enabled
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const localOverride = getLocalOverride(flag)
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (localOverride !== undefined) {
      return coerceBooleanFlag(localOverride) ?? false
    }

    const value = analytics.getFeatureFlag?.(flag)
    return coerceBooleanFlag(value) ?? false
  })

  useEffect(() => {
    if (localOverride !== undefined) {
      setEnabled(coerceBooleanFlag(localOverride) ?? false)
      return
    }

    const updateNewFeatureFlags = () => {
      const value = analytics.getFeatureFlag?.(flag)
      setEnabled(coerceBooleanFlag(value) ?? false)
    }

    updateNewFeatureFlags()
    return analytics.onFeatureFlags?.(updateNewFeatureFlags)
  }, [flag, localOverride])

  return enabled
}

/**
 * Check if Bridge virtual bank account feature is enabled
 */
export function useBridgeVirtualBankAccountEnabled(): boolean {
  return useFeatureFlag('bridge_virtual_bank_account')
}
