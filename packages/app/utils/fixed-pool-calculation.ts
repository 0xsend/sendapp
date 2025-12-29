import type { Database } from '@my/supabase/database.types'
import { DISTRIBUTION_11_MULTIPLIER } from 'app/features/rewards/activity/constants'

// PERC_DENOM constant - matches distributor weights.ts
// From: apps/distributor/src/weights.ts line 35
export const PERC_DENOM = 1000000000000000000n

export type VerificationType = Database['public']['Enums']['verification_type']

export type MultiplierConfig = {
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

  const scaledPreviousReward = (previousReward * PERC_DENOM) / BigInt(scalingDivisor)
  const scaledWeight = sendCeilingWeight * PERC_DENOM

  const cappedWeight = scaledWeight > scaledPreviousReward ? scaledPreviousReward : scaledWeight

  return (cappedWeight * PERC_DENOM) / scaledPreviousReward
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
  let amount = (baseAmount * BigInt(Math.round(multiplier * Number(PERC_DENOM)))) / PERC_DENOM

  // Apply slashing
  amount = (amount * slashPercentage) / PERC_DENOM

  // Apply hodler cap
  if (amount > hodlerCapAmount) {
    amount = hodlerCapAmount
  }

  return amount
}

/**
 * Calculate all multipliers for a user's verifications.
 * Pattern from: distributorv2.ts lines 567-609
 *
 * @param verifications Array of user's verification data with weights
 * @param verificationValues Map of verification types to their configs
 * @returns Record of multipliers by verification type
 */
export function calculateAllMultipliers(
  verifications: Array<{ type: VerificationType; weight: bigint }>,
  verificationValues: Map<
    VerificationType,
    { multiplier_min: number; multiplier_max: number; multiplier_step: number }
  >
): Record<string, { value?: number }> {
  const multipliers: Record<string, { value?: number }> = {}

  for (const verification of verifications) {
    const vvData = verificationValues.get(verification.type)
    if (!vvData) continue
    if (vvData.multiplier_step <= 0 && vvData.multiplier_max <= 1.0) continue

    const weight = Number(verification.weight)
    if (weight === 0) continue

    const multiplierValue = calculateMultiplier(weight, undefined, {
      min: vvData.multiplier_min,
      max: vvData.multiplier_max,
      step: vvData.multiplier_step,
    })

    multipliers[verification.type] = { value: multiplierValue }
  }

  return multipliers
}

/**
 * Calculate previous reward amount for slash calculation.
 * Pattern from: distributorv2.ts lines 625-626
 *
 * @param previousShares Array of previous distribution shares
 * @param distributionNumber Current distribution number
 * @param hodlerMinBalance Fallback minimum balance
 * @returns Previous reward amount
 */
export function calculatePreviousReward(
  previousShares: Array<{ amount: string }> | undefined,
  distributionNumber: number,
  hodlerMinBalance: bigint
): bigint {
  if (!previousShares || previousShares.length === 0) {
    return hodlerMinBalance
  }

  return previousShares.reduce(
    (acc, curr) =>
      acc +
      (distributionNumber === 11
        ? BigInt(curr.amount) * BigInt(DISTRIBUTION_11_MULTIPLIER)
        : BigInt(curr.amount)),
    0n
  )
}

/**
 * Calculate task SEND amount with multipliers and slashing.
 * Pattern from: distributorv2.ts lines 583-637
 *
 * @param taskBaseAmount Base amount for the specific task (fixedValue * weight)
 * @param allMultipliers All multipliers calculated for user
 * @param sendCeilingWeight User's send ceiling weight
 * @param previousReward Previous distribution reward
 * @param sendSlashScalingDivisor Scaling divisor from send_slash config
 * @returns Final task amount after multipliers and slashing
 */
export function calculateTaskAmount(
  taskBaseAmount: bigint,
  allMultipliers: Record<string, { value?: number }>,
  sendCeilingWeight: bigint,
  previousReward: bigint,
  sendSlashScalingDivisor: number
): bigint {
  // Apply combined multiplier
  const finalMultiplier = calculateCombinedMultiplier(allMultipliers)
  let amount =
    (taskBaseAmount * BigInt(Math.round(finalMultiplier * Number(PERC_DENOM)))) / PERC_DENOM

  // Apply send slash
  if (sendCeilingWeight > 0n) {
    const slashPercentage = calculateSlashPercentage(
      sendCeilingWeight,
      previousReward,
      sendSlashScalingDivisor
    )
    amount = (amount * slashPercentage) / PERC_DENOM
  } else {
    amount = 0n
  }

  return amount
}
