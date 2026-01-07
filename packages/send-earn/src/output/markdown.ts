import { formatUnits } from 'viem'
import type { DryRunResult } from '../types'

/**
 * Truncate address to 0x1234...abcd format.
 */
function truncateAddress(address: string): string {
  if (address.length <= 13) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Format bigint token amount to human-readable string with commas.
 */
function formatAmount(amount: bigint, decimals = 18): string {
  const formatted = formatUnits(amount, decimals)
  const num = Number.parseFloat(formatted)
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Format dry run result as Markdown.
 */
export function formatMarkdown(result: DryRunResult): string {
  const lines: string[] = []

  lines.push('## Send Earn Revenue Dry Run')
  lines.push('')
  lines.push('| Vault | MORPHO | WELL |')
  lines.push('|-------|--------|------|')

  for (const v of result.vaults) {
    lines.push(
      `| ${truncateAddress(v.vault)} | ${formatAmount(v.morphoAmount)} | ${formatAmount(v.wellAmount)} |`
    )
  }

  lines.push('')
  lines.push('**Totals:**')
  lines.push(
    `- Harvestable: ${formatAmount(result.totals.harvestable.morpho)} MORPHO, ${formatAmount(result.totals.harvestable.well)} WELL`
  )
  lines.push(
    `- Vault Balances: ${formatAmount(result.totals.vaultBalances.morpho)} MORPHO, ${formatAmount(result.totals.vaultBalances.well)} WELL`
  )
  lines.push(
    `- Sweepable: ${formatAmount(result.totals.sweepable.morpho)} MORPHO, ${formatAmount(result.totals.sweepable.well)} WELL`
  )

  return lines.join('\n')
}
