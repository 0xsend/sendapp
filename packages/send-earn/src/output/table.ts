import { formatUnits } from 'viem'
import type { DryRunResult, VaultRevenue, VaultBalances } from '../types'

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
 * Pad string to fixed width.
 */
function pad(str: string, width: number, align: 'left' | 'right' = 'right'): string {
  if (str.length >= width) return str
  const padding = ' '.repeat(width - str.length)
  return align === 'left' ? str + padding : padding + str
}

/**
 * Format dry run result as ASCII table.
 */
export function formatTable(result: DryRunResult): string {
  const lines: string[] = []

  // Header
  lines.push(`┌${'─'.repeat(65)}┐`)
  lines.push(`│${pad('Send Earn Revenue Dry Run', 65, 'left').slice(0, 65)}│`)
  lines.push(`├${'─'.repeat(26)}┬${'─'.repeat(14)}┬${'─'.repeat(22)}┤`)
  lines.push(`│${pad('Vault', 26, 'left')}│${pad('MORPHO', 14)}│${pad('WELL', 22)}│`)
  lines.push(`├${'─'.repeat(26)}┼${'─'.repeat(14)}┼${'─'.repeat(22)}┤`)

  // Vault rows
  const vaultMap = new Map<string, { revenue: VaultRevenue; balance: VaultBalances }>()
  for (const v of result.vaults) {
    vaultMap.set(v.vault.toLowerCase(), {
      revenue: v,
      balance: result.balances.find((b) => b.vault.toLowerCase() === v.vault.toLowerCase()) ?? {
        vault: v.vault,
        morphoBalance: 0n,
        wellBalance: 0n,
      },
    })
  }

  for (const [, { revenue }] of vaultMap) {
    const morphoStr = formatAmount(revenue.morphoAmount)
    const wellStr = formatAmount(revenue.wellAmount)
    lines.push(
      `│ ${pad(truncateAddress(revenue.vault), 24, 'left')} │${pad(morphoStr, 13)} │${pad(wellStr, 21)} │`
    )
  }

  // Totals section
  lines.push(`├${'─'.repeat(26)}┼${'─'.repeat(14)}┼${'─'.repeat(22)}┤`)

  const harvestMorpho = formatAmount(result.totals.harvestable.morpho)
  const harvestWell = formatAmount(result.totals.harvestable.well)
  lines.push(
    `│ ${pad('Total Harvestable', 24, 'left')} │${pad(harvestMorpho, 13)} │${pad(harvestWell, 21)} │`
  )

  const balMorpho = formatAmount(result.totals.vaultBalances.morpho)
  const balWell = formatAmount(result.totals.vaultBalances.well)
  lines.push(
    `│ ${pad('Current Vault Balances', 24, 'left')} │${pad(balMorpho, 13)} │${pad(balWell, 21)} │`
  )

  const sweepMorpho = formatAmount(result.totals.sweepable.morpho)
  const sweepWell = formatAmount(result.totals.sweepable.well)
  lines.push(
    `│ ${pad('Total Sweepable', 24, 'left')} │${pad(sweepMorpho, 13)} │${pad(sweepWell, 21)} │`
  )

  lines.push(`└${'─'.repeat(26)}┴${'─'.repeat(14)}┴${'─'.repeat(22)}┘`)

  // Fee Shares Section (vault shares held by fee recipients)
  lines.push('')
  lines.push(`┌${'─'.repeat(65)}┐`)
  lines.push(`│${pad('Fee Shares (Vault Shares)', 65, 'left').slice(0, 65)}│`)
  lines.push(`├${'─'.repeat(40)}┬${'─'.repeat(22)}┤`)
  lines.push(`│${pad('Category', 40, 'left')}│${pad('Shares', 22)}│`)
  lines.push(`├${'─'.repeat(40)}┼${'─'.repeat(22)}┤`)

  const affiliateShares = result.feeShares.totals.affiliateShares.toString()
  const directShares = result.feeShares.totals.directShares.toString()
  const totalFeeShares = (
    result.feeShares.totals.affiliateShares + result.feeShares.totals.directShares
  ).toString()

  lines.push(
    `│ ${pad(`Affiliate Contracts (${result.feeShares.affiliates.length})`, 38, 'left')} │${pad(affiliateShares, 21)} │`
  )
  lines.push(
    `│ ${pad(`Direct Recipients (${result.feeShares.directRecipients.length})`, 38, 'left')} │${pad(directShares, 21)} │`
  )
  lines.push(`├${'─'.repeat(40)}┼${'─'.repeat(22)}┤`)
  lines.push(`│ ${pad('Total Fee Shares', 38, 'left')} │${pad(totalFeeShares, 21)} │`)
  lines.push(`└${'─'.repeat(40)}┴${'─'.repeat(22)}┘`)

  return lines.join('\n')
}
