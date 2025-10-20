import type { KyberRouteSummary } from '@my/api/src/routers/swap/types'

export type PriceImpactLevel = 'normal' | 'medium' | 'high'

export interface PriceImpactResult {
  percent: number
  level: PriceImpactLevel
  formatted: string
}

/**
 * Calculates pure price impact excluding protocol fees.
 *
 * Price impact represents the market effect of your trade on the execution price.
 * It's calculated by comparing the USD value you'd get at perfect market rate
 * vs. the actual USD value after routing (but before our Send fee).
 *
 * Formula:
 * 1. Remove Send fee from output: actualOutputBeforeFee = amountOutUsd / (1 - 0.0075)
 * 2. Calculate impact: priceImpact = ((amountInUsd - actualOutputBeforeFee) / amountInUsd) × 100
 *
 * Gas fees are excluded as they're paid separately in USDC.
 *
 * @param routeSummary - KyberSwap route summary with USD values
 * @returns Price impact percentage (positive = loss, negative = gain)
 */
export const calculatePriceImpact = (routeSummary: KyberRouteSummary): number => {
  const amountInUsd = Number(routeSummary.amountInUsd)
  const amountOutUsd = Number(routeSummary.amountOutUsd)

  if (amountInUsd === 0) {
    return 0
  }

  // Extract Send fee percentage from route (default 0.75% if not present)
  const feeAmount = Number(routeSummary.extraFee?.feeAmount || '75')
  const isInBps = routeSummary.extraFee?.isInBps ?? true
  const feePercent = isInBps ? feeAmount / 10000 : feeAmount / 100

  // Remove our Send fee from output to get actual market output
  // (KyberSwap includes our fee in their quote since we pass chargeFeeBy: currency_out)
  const actualOutputBeforeFee = amountOutUsd / (1 - feePercent)

  // Calculate pure price impact (excluding fees and gas)

  return ((amountInUsd - actualOutputBeforeFee) / amountInUsd) * 100
}

/**
 * Alternative calculation for EXACT_OUT estimates.
 * Uses the same logic but with estimate data structure.
 */
export const calculatePriceImpactFromEstimate = (
  amountInUsd: string,
  amountOutUsd: string,
  feePercent = 0.0075
): number => {
  const inUsd = Number(amountInUsd)
  const outUsd = Number(amountOutUsd)

  if (inUsd === 0) {
    return 0
  }

  const actualOutputBeforeFee = outUsd / (1 - feePercent)

  return ((inUsd - actualOutputBeforeFee) / inUsd) * 100
}

/**
 * Determines the risk level based on price impact percentage.
 *
 * Thresholds:
 * - < 3%: Normal - typical for liquid pairs
 * - 3-10%: Medium - noticeable impact, but acceptable for less liquid pairs
 * - > 10%: High - significant impact, likely low liquidity pool
 *
 * @param priceImpactPercent - Price impact as a percentage
 * @returns Risk level classification
 */
export const getPriceImpactLevel = (priceImpactPercent: number): PriceImpactLevel => {
  const absImpact = Math.abs(priceImpactPercent)

  if (absImpact < 3) {
    return 'normal'
  }
  if (absImpact < 10) {
    return 'medium'
  }
  return 'high'
}

/**
 * Formats price impact percentage for display.
 *
 * @param priceImpactPercent - Price impact percentage
 * @returns Formatted string with appropriate precision
 */
export const formatPriceImpact = (priceImpactPercent: number): string => {
  const absImpact = Math.abs(priceImpactPercent)

  // For very small impacts (< 0.5%), show <0.5% to avoid noisy/negative data on small volumes
  if (absImpact < 0.5) {
    return '<0.5%'
  }

  // For impacts < 10%, show 2 decimals for precision
  if (absImpact < 10) {
    return `${priceImpactPercent.toFixed(2)}%`
  }

  // For larger impacts, show 2 decimals
  return `${priceImpactPercent.toFixed(2)}%`
}

/**
 * Gets complete price impact analysis.
 *
 * @param routeSummary - KyberSwap route summary
 * @returns Price impact with level, formatting, and percentage
 */
export const getPriceImpactAnalysis = (
  routeSummary: KyberRouteSummary | null | undefined
): PriceImpactResult | null => {
  if (!routeSummary) {
    return null
  }

  const percent = calculatePriceImpact(routeSummary)
  const level = getPriceImpactLevel(percent)
  const formatted = formatPriceImpact(percent)

  return {
    percent,
    level,
    formatted,
  }
}

/**
 * Gets color for price impact level (Tamagui theme tokens).
 */
export const getPriceImpactColor = (level: PriceImpactLevel, isDarkTheme = true) => {
  switch (level) {
    case 'normal':
      return '$color12' as const // Default text color
    case 'medium':
      return isDarkTheme ? ('$warning' as const) : ('$orange8' as const)
    case 'high':
      return '$error' as const // Error red
  }
}

/**
 * Gets warning message based on price impact level.
 * Messages are informative but not discouraging.
 *
 * @param level - Price impact risk level
 * @returns User-friendly info message or null
 */
export const getPriceImpactMessage = (level: PriceImpactLevel): string | null => {
  switch (level) {
    case 'medium':
      return 'High'
    case 'high':
      return 'Very high'
    default:
      return null
  }
}
