import type { Database } from '@my/supabase/database.types'
import type { UseDistributionsResultData } from './distributions'
import type { DistributionsVerificationsQuery } from './distributions'

export type VerificationType = Database['public']['Enums']['verification_type']

// UseDistributionsResultData is already an array type, so [number] extracts a single element
type Distribution = UseDistributionsResultData[number]

export type RewardBreakdownItem = {
  type: VerificationType
  baseAmount: bigint
  multipliedAmount: bigint
  multiplier: number
  weight: bigint
  percentage: number
}

export type RewardBreakdown = {
  fixedPoolBreakdown: RewardBreakdownItem[]
  hodlerPoolAmount: bigint
  totalFixedPool: bigint
  totalHodlerPool: bigint
  totalAmount: bigint
  hodlerPoolPercentage: number
  fixedPoolPercentage: number
}

/**
 * Calculates an approximate breakdown of rewards from distribution_shares.
 *
 * Note: This is an approximation that shows relative contributions based on
 * the user's completed verifications. It cannot replicate the exact distributor
 * calculation which requires all users' data for the sigmoid curve.
 *
 * @param distribution The distribution data including shares and verification values
 * @param verifications The user's verification data
 * @returns A breakdown object showing how rewards are composed
 */
export function calculateRewardsBreakdown(
  distribution: Distribution | undefined | null,
  verifications: NonNullable<DistributionsVerificationsQuery['data']> | null | undefined
): RewardBreakdown | null {
  if (!distribution || !verifications) {
    return null
  }

  const share = distribution.distribution_shares?.[0]
  if (!share) {
    return null
  }

  const totalAmount = BigInt(share.amount ?? BigInt(0))
  const totalFixedPool = BigInt(share.fixed_pool_amount ?? BigInt(0))
  const totalHodlerPool = BigInt(share.hodler_pool_amount ?? BigInt(0))

  if (totalAmount === BigInt(0)) {
    return {
      fixedPoolBreakdown: [],
      hodlerPoolAmount: BigInt(0),
      totalFixedPool: BigInt(0),
      totalHodlerPool: BigInt(0),
      totalAmount: BigInt(0),
      hodlerPoolPercentage: 0,
      fixedPoolPercentage: 0,
    }
  }

  // Calculate percentages for hodler vs fixed pool
  const hodlerPoolPercentage =
    totalAmount > BigInt(0) ? Number((totalHodlerPool * BigInt(10000)) / totalAmount) / 100 : 0
  const fixedPoolPercentage =
    totalAmount > BigInt(0) ? Number((totalFixedPool * BigInt(10000)) / totalAmount) / 100 : 0

  // Build breakdown for fixed pool rewards by verification type
  const fixedPoolBreakdown: RewardBreakdownItem[] = []

  // Get verification values and multipliers
  const verificationValueMap = new Map(
    distribution.distribution_verification_values.map((vv) => [
      vv.type,
      {
        fixedValue: BigInt(vv.fixed_value ?? BigInt(0)),
        multiplier_min: vv.multiplier_min,
        multiplier_max: vv.multiplier_max,
        multiplier_step: vv.multiplier_step,
      },
    ])
  )

  // Calculate base amounts for each verification the user completed
  let totalBaseAmount = BigInt(0)
  const itemsWithBase: Array<{
    type: VerificationType
    baseAmount: bigint
    weight: bigint
    multiplier: number
  }> = []

  for (const verification of verifications.verification_values) {
    const vvData = verificationValueMap.get(verification.type)
    if (!vvData || vvData.fixedValue === BigInt(0)) {
      continue
    }

    const weight = BigInt(verification.weight ?? BigInt(0))
    if (weight === BigInt(0)) {
      continue
    }

    // Calculate base fixed amount (before multipliers)
    const baseAmount = vvData.fixedValue * weight

    // Find multiplier for this verification type
    const multiplierData = verifications.multipliers.find((m) => m.type === verification.type)
    const multiplier = multiplierData?.value ?? 1.0

    totalBaseAmount += baseAmount

    itemsWithBase.push({
      type: verification.type,
      baseAmount,
      weight,
      multiplier,
    })
  }

  // Distribute the actual fixed pool amount proportionally based on base amounts
  // This accounts for multipliers, capping, and slashing that happened in the distributor
  for (const item of itemsWithBase) {
    const proportion =
      totalBaseAmount > BigInt(0) ? (item.baseAmount * BigInt(10000)) / totalBaseAmount : BigInt(0)

    const multipliedAmount = (totalFixedPool * proportion) / BigInt(10000)

    const percentage =
      totalAmount > BigInt(0) ? Number((multipliedAmount * BigInt(10000)) / totalAmount) / 100 : 0

    fixedPoolBreakdown.push({
      type: item.type,
      baseAmount: item.baseAmount,
      multipliedAmount,
      multiplier: item.multiplier,
      weight: item.weight,
      percentage,
    })
  }

  // Sort by contribution amount (largest first)
  fixedPoolBreakdown.sort((a, b) => {
    if (a.multipliedAmount === b.multipliedAmount) return 0
    return a.multipliedAmount > b.multipliedAmount ? -1 : 1
  })

  return {
    fixedPoolBreakdown,
    hodlerPoolAmount: totalHodlerPool,
    totalFixedPool,
    totalHodlerPool,
    totalAmount,
    hodlerPoolPercentage,
    fixedPoolPercentage,
  }
}

/**
 * Format a breakdown item for display
 */
export function formatBreakdownItem(
  item: RewardBreakdownItem,
  decimals: number
): {
  amount: string
  percentage: string
  multiplier: string
} {
  const amount = formatRewardAmount(item.multipliedAmount, decimals)
  const percentage = item.percentage.toFixed(1)
  const multiplier = item.multiplier > 1 ? `${item.multiplier.toFixed(1)}x` : ''

  return {
    amount,
    percentage,
    multiplier,
  }
}

/**
 * Format reward amount for display
 */
export function formatRewardAmount(amount: bigint, decimals: number): string {
  // Convert to string with proper decimal places
  const divisor = BigInt(10 ** decimals)
  const whole = amount / divisor
  const fraction = amount % divisor

  if (fraction === BigInt(0)) {
    return whole.toString()
  }

  // Format fraction with decimals
  const fractionStr = fraction.toString().padStart(decimals, '0')
  // Remove trailing zeros
  const trimmedFraction = fractionStr.replace(/0+$/, '')

  if (trimmedFraction === '') {
    return whole.toString()
  }

  return `${whole}.${trimmedFraction}`
}

/**
 * Calculate breakdown for a single verification type.
 * Returns the reward amount and percentage contribution for one task.
 *
 * @param distribution The distribution data
 * @param verifications The user's verification data
 * @param verificationType The specific verification type to calculate for
 * @returns Breakdown item or null if not applicable
 */
export function calculateTaskBreakdown(
  distribution: Distribution | undefined | null,
  verifications: NonNullable<DistributionsVerificationsQuery['data']> | null | undefined,
  verificationType: VerificationType
): { amount: string; percentage: string } | null {
  const breakdown = calculateRewardsBreakdown(distribution, verifications)

  if (!breakdown) {
    return null
  }

  const item = breakdown.fixedPoolBreakdown.find((i) => i.type === verificationType)

  if (!item) {
    return null
  }

  const decimals = distribution?.token_decimals ?? 18
  const formatted = formatBreakdownItem(item, decimals)

  return {
    amount: formatted.amount,
    percentage: formatted.percentage,
  }
}

/**
 * Calculate the hodler cap amount (max fixed_pool_amount).
 * This is an approximation using the formula: snapshotBalance + earnScore
 *
 * From distributorv2.ts line 631-634:
 * hodlerCapAmount = initialHodlerAmount + sendScore + totalTicketPurchaseValue
 *
 * For UI approximation we use: snapshotBalance + earnScore
 *
 * @param snapshotBalance The user's SEND balance at snapshot
 * @param earnScore The user's sendEarn score (total assets in sendEarn vaults)
 * @returns The calculated hodler cap amount
 */
export function calculateHodlerCapAmount(snapshotBalance: bigint, earnScore: bigint): bigint {
  return snapshotBalance + earnScore
}

/**
 * Calculate user's position on the sigmoid curve used for hodler rewards.
 *
 * This approximates the sigmoid weight calculation from weights.ts (lines 311-374).
 * Since we don't have all users' balances, this is an approximation.
 *
 * @param userBalance The user's balance
 * @param allBalances Array of all holder balances (sorted descending for rank calculation)
 * @returns Object with rank percentile (0-100) and curve multiplier (0.7-1.2)
 */
export function calculateSigmoidPosition(
  userBalance: bigint,
  allBalances: bigint[]
): { rankPercentile: number; curveMultiplier: number } {
  if (allBalances.length === 0 || userBalance === BigInt(0)) {
    return { rankPercentile: 0, curveMultiplier: 0.7 }
  }

  // Find user's rank (1-indexed, where 1 is highest balance)
  const sortedBalances = [...allBalances].sort((a, b) => {
    if (a === b) return 0
    return a > b ? -1 : 1
  })

  const rank = sortedBalances.findIndex((b) => b <= userBalance) + 1
  const totalHolders = sortedBalances.length

  // Calculate cumulative rank (percentile from bottom, scaled to 0-1)
  const rankPercentile = ((totalHolders - rank + 1) / totalHolders) * 100
  const cumulativeRankScaled =
    (BigInt(totalHolders - rank + 1) * BigInt(1e18)) / BigInt(totalHolders)

  // Sigmoid calculation (simplified from weights.ts)
  const ONE = BigInt(1e18)
  const centerScaled = (ONE * BigInt(3)) / BigInt(5) // 0.6
  const diff = cumulativeRankScaled - centerScaled
  const steepness = 5 // SIGMOID_CONFIG.steepness
  const yScaled = BigInt(-1) * BigInt(steepness) * diff

  // Simplified exponential approximation for UI
  // exp(y) ≈ 1 + y + y²/2 + y³/6 (Taylor series)
  const y = Number(yScaled) / 1e18
  const expValue = Math.exp(y)
  const sScaled = 1 / (1 + expValue)

  // Inverted-bell influence: bump = 2*s*(1-s)
  const bump = 2 * sScaled * (1 - sScaled)

  // Influence range [0.7, 1.2]
  const MIN_FACTOR = 0.7
  const MAX_FACTOR = 1.2
  const range = MAX_FACTOR - MIN_FACTOR
  const influence = MIN_FACTOR + range * bump

  // Final factor follows sigmoid and is modulated by bell influence
  const curveMultiplier = sScaled * influence

  return {
    rankPercentile: Math.round(rankPercentile * 10) / 10,
    curveMultiplier: Math.round(curveMultiplier * 100) / 100,
  }
}

/**
 * Calculate percentile from raw rank and total count.
 *
 * @param rank - 0-based rank position (0 = lowest balance, higher = higher balance)
 * @param totalCount - Total number of qualifying users with amount > 0
 * @returns Percentile (0-100, where 100 is highest balance)
 *
 * Example from: apps/distributor/src/weights.ts lines 134, 147
 * (original percentile calculation before refactor)
 */
export function calculatePercentileFromRank(rank: number, totalCount: number): number {
  if (totalCount <= 1) {
    return 50 // Default for single user
  }
  return (rank / (totalCount - 1)) * 100
}

/**
 * Calculate the weight multiplier from a balance rank percentile.
 * This is a simplified version for UI display purposes.
 *
 * For Sigmoid mode (the primary mode used in distributions):
 * - Percentile 0-20%: reduced weights (0.7x - 0.9x)
 * - Percentile 20-80%: enhanced weights (0.9x - 1.1x)
 * - Percentile 80-100%: reduced weights (1.1x - 0.7x)
 *
 * @param percentile Balance rank percentile (0-100, where 100 is highest balance)
 * @param mode Weight calculation mode (defaults to Sigmoid)
 * @returns Weight multiplier
 */
export function getMultiplierFromPercentile(
  percentile: number,
  mode: 'sigmoid' | 'ease_in_out' | 'linear' = 'sigmoid'
): number {
  const t = percentile / 100

  if (mode === 'linear') {
    return t
  }

  if (mode === 'ease_in_out') {
    // Cubic Bezier curve
    const p0 = 0
    const p1 = 0.1 // 10% control point
    const p2 = 0.9 // 90% control point
    const p3 = 1

    const inv_t = 1 - t
    const t2 = t * t
    const t3 = t2 * t
    const inv_t2 = inv_t * inv_t
    const inv_t3 = inv_t2 * inv_t

    const term1 = inv_t3 * p0
    const term2 = 3 * inv_t2 * t * p1
    const term3 = 3 * inv_t * t2 * p2
    const term4 = t3 * p3

    return Number((term1 + term2 + term3 + term4).toFixed(2))
  }

  // Sigmoid mode (default)
  const center = 0.6
  const steepness = 8
  const diff = t - center
  const y = -steepness * diff
  const s = 1 / (1 + Math.exp(y))
  const bump = 2 * s * (1 - s)
  const MIN_FACTOR = 0.7
  const MAX_FACTOR = 1.2
  const range = MAX_FACTOR - MIN_FACTOR
  const influence = MIN_FACTOR + range * bump

  return Number((s * influence).toFixed(2))
}
