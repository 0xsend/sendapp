import { formatUnits } from 'viem'
import type { DryRunResult } from '../types'

/**
 * Format amount to decimal string.
 */
function formatAmount(amount: bigint, decimals = 18): string {
  const formatted = formatUnits(amount, decimals)
  return Number.parseFloat(formatted).toFixed(2)
}

/**
 * Format dry run result as CSV.
 */
export function formatCsv(result: DryRunResult): string {
  const lines: string[] = []

  // Header
  lines.push('vault,morpho_harvestable,well_harvestable,morpho_balance,well_balance')

  // Data rows
  for (const v of result.vaults) {
    const balance = result.balances.find(
      (b) => b.vault.toLowerCase() === v.vault.toLowerCase()
    ) ?? { morphoBalance: 0n, wellBalance: 0n }

    lines.push(
      [
        v.vault,
        formatAmount(v.morphoAmount),
        formatAmount(v.wellAmount),
        formatAmount(balance.morphoBalance),
        formatAmount(balance.wellBalance),
      ].join(',')
    )
  }

  return lines.join('\n')
}
