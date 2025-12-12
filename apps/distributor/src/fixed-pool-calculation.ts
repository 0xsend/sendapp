import type { Database } from '@my/supabase/database.types'
import { PERC_DENOM as PERC_DENOM_INTERNAL } from './weights'

// Re-export PERC_DENOM for use in both backend and frontend
export const PERC_DENOM = PERC_DENOM_INTERNAL

export type VerificationType = Database['public']['Enums']['verification_type']

export type MultiplierConfig = {
  min: number
  max: number
  step: number
}

export type Multiplier = {
  value?: number
  min: number
  max: number
  step: number
}

/**
 * Calculate base fixed pool amount (before multipliers)
 *
 * Pattern from: distributorv2.ts lines 564-586
 *
 * @param verifications Array of user's verifications with weights
 * @param verificationValues Map of verification types to their fixed values
 * @returns Base fixed amount before multipliers
 */
export function calculateBaseFixedAmount(
  verifications: Array<{ type: VerificationType; weight: bigint }>,
  verificationValues: Map<
    VerificationType,
    { fixedValue?: bigint; multiplier_min: number; multiplier_max: number; multiplier_step: number }
  >
): bigint {
  let total = 0n
  for (const verification of verifications) {
    const config = verificationValues.get(verification.type)
    if (!config?.fixedValue) continue
    total += config.fixedValue * verification.weight
  }
  return total
}

/**
 * Calculate multiplier for a single verification type based on weight.
 *
 * Pattern from: distributorv2.ts lines 602-622
 *
 * Logic:
 * - weight = 0: Use currentValue or default to min
 * - weight = 1: Increment currentValue by step (up to max), or start at min
 * - weight > 1: Calculate as min + (weight - 1) * step (capped at max)
 *
 * @param weight The verification weight (number of times completed)
 * @param currentValue The current multiplier value (undefined if first time)
 * @param config Multiplier configuration (min, max, step)
 * @returns Calculated multiplier value
 */
export function calculateMultiplier(
  weight: number,
  currentValue: number | undefined,
  config: MultiplierConfig
): number {
  if (weight === 0) {
    return currentValue ?? config.min
  }
  if (weight === 1) {
    if (currentValue === undefined) {
      return config.min
    }
    return Math.min(currentValue + config.step, config.max)
  }
  return Math.min(config.min + (weight - 1) * config.step, config.max)
}

/**
 * Calculate combined multiplier across all verification types.
 *
 * Pattern from: distributorv2.ts lines 624-627
 *
 * @param multipliers Record of multiplier info by verification type
 * @returns Combined multiplier (product of all individual multipliers)
 */
export function calculateCombinedMultiplier(
  multipliers: Record<string, { value?: number }>
): number {
  return Object.values(multipliers).reduce((acc, info) => acc * (info.value ?? 1.0), 1.0)
}

/**
 * Calculate slash percentage based on send ceiling weight.
 *
 * Pattern from: distributorv2.ts lines 640-660
 * Also used in: screen.tsx lines 757-765 (ProgressCard)
 *
 * The slash percentage represents how much of the reward the user keeps
 * based on their send activity relative to their previous reward.
 *
 * @param sendCeilingWeight The user's send ceiling weight (total sent amount)
 * @param previousReward The user's previous distribution reward amount
 * @param scalingDivisor Scaling factor for the slash calculation
 * @returns Slash percentage (as fraction with PERC_DENOM denominator)
 */
export function calculateSlashPercentage(
  sendCeilingWeight: bigint,
  previousReward: bigint,
  scalingDivisor: number
): bigint {
  if (previousReward === 0n) {
    return 0n
  }

  const scaledPreviousReward = (previousReward * PERC_DENOM_INTERNAL) / BigInt(scalingDivisor)
  const scaledWeight = sendCeilingWeight * PERC_DENOM_INTERNAL

  const cappedWeight = scaledWeight > scaledPreviousReward ? scaledPreviousReward : scaledWeight

  return (cappedWeight * PERC_DENOM_INTERNAL) / scaledPreviousReward
}

/**
 * Calculate final fixed pool amount with multipliers, slashing, and capping.
 *
 * Pattern from: distributorv2.ts lines 636-670
 *
 * Steps:
 * 1. Apply multiplier to base amount
 * 2. Apply slashing based on send activity
 * 3. Cap by hodler amount (prevents fixed pool from exceeding hodler entitlement)
 *
 * @param baseAmount Base fixed pool amount before multipliers
 * @param multiplier Combined multiplier from all verification types
 * @param slashPercentage Slash percentage (0 to PERC_DENOM)
 * @param hodlerCapAmount Maximum allowed amount (user's hodler entitlement)
 * @returns Final fixed pool amount after all adjustments
 */
export function calculateFixedPoolAmount(
  baseAmount: bigint,
  multiplier: number,
  slashPercentage: bigint,
  hodlerCapAmount: bigint
): bigint {
  // Apply multiplier
  let amount =
    (baseAmount * BigInt(Math.round(multiplier * Number(PERC_DENOM_INTERNAL)))) /
    PERC_DENOM_INTERNAL

  // Apply slashing
  amount = (amount * slashPercentage) / PERC_DENOM_INTERNAL

  // Apply hodler cap
  if (amount > hodlerCapAmount) {
    amount = hodlerCapAmount
  }

  return amount
}
