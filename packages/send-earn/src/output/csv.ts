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

  // Merkl rewards section
  lines.push('# Merkl Rewards')
  lines.push('vault,morpho_harvestable,well_harvestable,morpho_balance,well_balance')

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

  // Fee shares section
  lines.push('')
  lines.push('# Fee Shares')
  lines.push('vault,fee_recipient,type,redeemable_shares')

  for (const a of result.feeShares.affiliates) {
    lines.push([a.vault, a.feeRecipient, 'affiliate', a.redeemableShares.toString()].join(','))
  }

  for (const d of result.feeShares.directRecipients) {
    lines.push([d.vault, d.feeRecipient, 'direct', d.redeemableShares.toString()].join(','))
  }

  // Totals section
  lines.push('')
  lines.push('# Fee Share Totals')
  lines.push('category,shares')
  lines.push(`affiliate_shares,${result.feeShares.totals.affiliateShares.toString()}`)
  lines.push(`direct_shares,${result.feeShares.totals.directShares.toString()}`)

  return lines.join('\n')
}
