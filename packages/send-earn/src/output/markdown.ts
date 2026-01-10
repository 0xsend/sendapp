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

  // Merkl rewards section
  lines.push('## Send Earn Revenue Dry Run')
  lines.push('')
  lines.push('### Merkl Rewards')
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

  // Fee shares section
  lines.push('')
  lines.push('### Fee Shares')
  lines.push('')

  if (result.feeShares.affiliates.length > 0) {
    lines.push('**Affiliate Contracts (automatable):**')
    lines.push('')
    lines.push('| Vault | Fee Recipient | Shares |')
    lines.push('|-------|---------------|--------|')
    for (const a of result.feeShares.affiliates) {
      lines.push(
        `| ${truncateAddress(a.vault)} | ${truncateAddress(a.feeRecipient)} | ${a.redeemableShares.toString()} |`
      )
    }
    lines.push('')
  }

  if (result.feeShares.directRecipients.length > 0) {
    lines.push('**Direct Recipients (manual):**')
    lines.push('')
    lines.push('| Vault | Fee Recipient | Shares |')
    lines.push('|-------|---------------|--------|')
    for (const d of result.feeShares.directRecipients) {
      lines.push(
        `| ${truncateAddress(d.vault)} | ${truncateAddress(d.feeRecipient)} | ${d.redeemableShares.toString()} |`
      )
    }
    lines.push('')
  }

  lines.push('**Fee Share Totals:**')
  lines.push(`- Affiliate Shares: ${result.feeShares.totals.affiliateShares.toString()}`)
  lines.push(`- Direct Shares: ${result.feeShares.totals.directShares.toString()}`)

  return lines.join('\n')
}
