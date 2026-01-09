#!/usr/bin/env bun
import 'zx/globals'
import { parseUnits } from 'viem'
import {
  dryRun,
  harvest,
  sweep,
  distributeFees,
  feesDryRun,
  tvl,
  createConfig,
  formatOutput,
} from '../src/index'
import type { FeeDistributionDryRunResult, TVLResult } from '../src/types'
import type { OutputFormat } from '../src/types'

const argv = minimist(process.argv.slice(2), {
  boolean: ['help', 'h'],
  string: ['db-url', 'rpc-url', 'vault', 'min-morpho', 'min-well', 'format'],
  alias: {
    h: 'help',
  },
  default: {
    format: 'table',
  },
})

const command = argv._[0]

function showHelp(): void {
  console.log(`
send-earn - Send Earn Revenue Collection CLI

Usage:
  send-earn <command> [options]

Commands:
  dry-run          Display harvestable rewards and vault balances (read-only)
  harvest          Execute Merkl claim transactions
  sweep            Execute vault sweep transactions to revenue safe
  fees-dry-run     Display pending fee shares for affiliate contracts (read-only)
  distribute-fees  Execute fee distribution on affiliate contracts
  tvl              Display Total Value Locked across all vaults (read-only)

Options:
  --db-url=<url>           PostgreSQL connection string (default: $DATABASE_URL)
  --rpc-url=<url>          Base chain RPC endpoint (default: $BASE_RPC_URL)
  --vault=<address>        Filter to specific vault (repeatable)
  --min-morpho=<amount>    Minimum MORPHO to harvest (default: 1)
  --min-well=<amount>      Minimum WELL to harvest (default: 10)
  --format=<format>        Output format: table, json, csv, markdown (default: table)
  -h, --help               Show this help message

Environment Variables:
  DATABASE_URL                     PostgreSQL connection string
  BASE_RPC_URL                     Base chain RPC endpoint
  REVENUE_COLLECTOR_PRIVATE_KEY    Private key for harvest/sweep operations

Examples:
  send-earn dry-run --format=json
  send-earn dry-run --vault=0x1234... --vault=0x5678...
  send-earn harvest --min-morpho=5
  send-earn sweep
  send-earn fees-dry-run
  send-earn distribute-fees
  send-earn tvl
  send-earn tvl --format=json
`)
}

/**
 * Truncate address to 0x1234...abcd format.
 */
function truncateAddress(address: string): string {
  if (address.length <= 13) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/**
 * Format fee distribution dry run result.
 */
function formatFeesDryRun(result: FeeDistributionDryRunResult, format: OutputFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(
        {
          affiliates: result.affiliates.map((a) => ({
            ...a,
            redeemableShares: a.redeemableShares.toString(),
          })),
          directRecipients: result.directRecipients.map((d) => ({
            ...d,
            redeemableShares: d.redeemableShares.toString(),
          })),
          totals: {
            affiliateShares: result.totals.affiliateShares.toString(),
            directShares: result.totals.directShares.toString(),
          },
        },
        null,
        2
      )

    case 'csv': {
      const lines: string[] = []
      lines.push('vault,fee_recipient,type,redeemable_shares')
      for (const a of result.affiliates) {
        lines.push([a.vault, a.feeRecipient, 'affiliate', a.redeemableShares.toString()].join(','))
      }
      for (const d of result.directRecipients) {
        lines.push([d.vault, d.feeRecipient, 'direct', d.redeemableShares.toString()].join(','))
      }
      lines.push('')
      lines.push('# Totals')
      lines.push('category,shares')
      lines.push(`affiliate_shares,${result.totals.affiliateShares.toString()}`)
      lines.push(`direct_shares,${result.totals.directShares.toString()}`)
      return lines.join('\n')
    }

    case 'markdown': {
      const lines: string[] = []
      lines.push('## Fee Distribution Dry Run')
      lines.push('')

      if (result.affiliates.length > 0) {
        lines.push('### Affiliate Contracts (automatable)')
        lines.push('')
        lines.push('| Vault | Fee Recipient | Shares |')
        lines.push('|-------|---------------|--------|')
        for (const a of result.affiliates) {
          lines.push(
            `| ${truncateAddress(a.vault)} | ${truncateAddress(a.feeRecipient)} | ${a.redeemableShares.toString()} |`
          )
        }
        lines.push('')
      }

      if (result.directRecipients.length > 0) {
        lines.push('### Direct Recipients (manual)')
        lines.push('')
        lines.push('| Vault | Fee Recipient | Shares |')
        lines.push('|-------|---------------|--------|')
        for (const d of result.directRecipients) {
          lines.push(
            `| ${truncateAddress(d.vault)} | ${truncateAddress(d.feeRecipient)} | ${d.redeemableShares.toString()} |`
          )
        }
        lines.push('')
      }

      lines.push('**Totals:**')
      lines.push(`- Affiliate Shares: ${result.totals.affiliateShares.toString()}`)
      lines.push(`- Direct Shares: ${result.totals.directShares.toString()}`)
      return lines.join('\n')
    }

    default: {
      // 'table' format (default)
      const lines: string[] = []

      lines.push(chalk.bold('\n=== Fee Distribution Dry Run ===\n'))

      // Affiliate contracts (automatable)
      lines.push(chalk.cyan('Affiliate Contracts (automatable via distribute-fees):'))
      if (result.affiliates.length === 0) {
        lines.push('  No affiliate contracts found')
      } else {
        for (const a of result.affiliates) {
          lines.push(`  Vault: ${a.vault}`)
          lines.push(`    Fee Recipient: ${a.feeRecipient}`)
          lines.push(`    Redeemable Shares: ${a.redeemableShares.toString()}`)
          if (a.affiliateDetails) {
            lines.push(`    Affiliate: ${a.affiliateDetails.affiliate}`)
            lines.push(`    Platform Vault: ${a.affiliateDetails.platformVault}`)
          }
          lines.push('')
        }
      }

      // Direct recipients (manual)
      lines.push(chalk.cyan('\nDirect Recipients (manual redemption required):'))
      if (result.directRecipients.length === 0) {
        lines.push('  No direct recipients found')
      } else {
        for (const d of result.directRecipients) {
          lines.push(`  Vault: ${d.vault}`)
          lines.push(`    Fee Recipient: ${d.feeRecipient}`)
          lines.push(`    Redeemable Shares: ${d.redeemableShares.toString()}`)
          lines.push('')
        }
      }

      // Totals
      lines.push(chalk.bold('\nTotals:'))
      lines.push(`  Affiliate Shares (automatable): ${result.totals.affiliateShares.toString()}`)
      lines.push(`  Direct Shares (manual): ${result.totals.directShares.toString()}`)

      return lines.join('\n')
    }
  }
}

/**
 * Format USDC amount (6 decimals) to human-readable string with commas.
 */
function formatUSDC(amount: bigint): string {
  const whole = amount / 1_000_000n
  const fraction = amount % 1_000_000n
  const wholeStr = whole.toLocaleString('en-US')
  const fractionStr = fraction.toString().padStart(6, '0').slice(0, 2)
  return `${wholeStr}.${fractionStr}`
}

/**
 * Pad string to specified length (for table formatting).
 */
function pad(str: string, len: number, align: 'left' | 'right' = 'right'): string {
  if (str.length >= len) return str.slice(0, len)
  const padding = ' '.repeat(len - str.length)
  return align === 'left' ? str + padding : padding + str
}

function formatTVL(result: TVLResult, format: OutputFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(
        {
          vaults: result.vaults.map((v) => ({
            vault: v.vault,
            totalAssets: v.totalAssets.toString(),
            totalSupply: v.totalSupply.toString(),
            underlyingVault: v.underlyingVault,
            vaultType: v.vaultType,
          })),
          totals: {
            totalAssets: result.totals.totalAssets.toString(),
            vaultCount: result.totals.vaultCount,
          },
        },
        null,
        2
      )

    case 'csv': {
      const lines: string[] = []
      lines.push('vault,total_assets,total_supply,underlying_vault,vault_type')
      for (const v of result.vaults) {
        lines.push(
          [
            v.vault,
            v.totalAssets.toString(),
            v.totalSupply.toString(),
            v.underlyingVault,
            v.vaultType,
          ].join(',')
        )
      }
      lines.push('')
      lines.push('# Totals')
      lines.push('total_assets,vault_count')
      lines.push(`${result.totals.totalAssets.toString()},${result.totals.vaultCount}`)
      return lines.join('\n')
    }

    case 'markdown': {
      const lines: string[] = []
      lines.push('## Send Earn TVL')
      lines.push('')
      lines.push('| Vault | TVL (USDC) | Underlying |')
      lines.push('|-------|------------|------------|')
      for (const v of result.vaults) {
        lines.push(
          `| ${truncateAddress(v.vault)} | ${formatUSDC(v.totalAssets)} | ${v.vaultType} |`
        )
      }
      lines.push('')
      lines.push(
        `**Total:** ${formatUSDC(result.totals.totalAssets)} USDC across ${result.totals.vaultCount} vaults`
      )
      return lines.join('\n')
    }

    default: {
      // 'table' format (default) - box-drawing table per spec
      const lines: string[] = []

      // Table header
      lines.push(`┌${'─'.repeat(26)}┬${'─'.repeat(18)}┬${'─'.repeat(19)}┐`)
      lines.push(`│${pad(' Send Earn TVL', 64, 'left')}│`)
      lines.push(`├${'─'.repeat(26)}┬${'─'.repeat(18)}┬${'─'.repeat(19)}┤`)
      lines.push(
        `│ ${pad('Vault', 24, 'left')} │ ${pad('TVL (USDC)', 16, 'left')} │ ${pad('Underlying', 17, 'left')} │`
      )
      lines.push(`├${'─'.repeat(26)}┼${'─'.repeat(18)}┼${'─'.repeat(19)}┤`)

      if (result.vaults.length === 0) {
        lines.push(`│ ${pad('No vaults found', 24, 'left')} │ ${pad('-', 16)} │ ${pad('-', 17)} │`)
      } else {
        for (const v of result.vaults) {
          const vaultAddr = truncateAddress(v.vault)
          const tvlStr = formatUSDC(v.totalAssets)
          lines.push(
            `│ ${pad(vaultAddr, 24, 'left')} │ ${pad(tvlStr, 16)} │ ${pad(v.vaultType, 17, 'left')} │`
          )
        }
      }

      // Totals row
      lines.push(`├${'─'.repeat(26)}┼${'─'.repeat(18)}┼${'─'.repeat(19)}┤`)
      const totalTvl = formatUSDC(result.totals.totalAssets)
      const vaultCountStr = `${result.totals.vaultCount} vaults`
      lines.push(
        `│ ${pad('Total', 24, 'left')} │ ${pad(totalTvl, 16)} │ ${pad(vaultCountStr, 17, 'left')} │`
      )
      lines.push(`└${'─'.repeat(26)}┴${'─'.repeat(18)}┴${'─'.repeat(19)}┘`)

      return lines.join('\n')
    }
  }
}

async function main(): Promise<void> {
  if (argv.help || !command) {
    showHelp()
    process.exit(argv.help ? 0 : 1)
  }

  const dbUrl = argv['db-url'] || process.env.DATABASE_URL
  const rpcUrl = argv['rpc-url'] || process.env.BASE_RPC_URL
  const collectorPrivateKey = process.env.REVENUE_COLLECTOR_PRIVATE_KEY

  if (!dbUrl) {
    console.error(chalk.red('Error: --db-url or DATABASE_URL is required'))
    process.exit(1)
  }

  if (!rpcUrl) {
    console.error(chalk.red('Error: --rpc-url or BASE_RPC_URL is required'))
    process.exit(1)
  }

  // Parse vault filter (can be repeated) - normalize to lowercase and deduplicate
  let vaultFilter: `0x${string}`[] | undefined
  if (argv.vault) {
    const vaults = Array.isArray(argv.vault) ? argv.vault : [argv.vault]
    const normalized = vaults.map((v: string) => v.toLowerCase() as `0x${string}`)
    vaultFilter = [...new Set(normalized)]
  }

  // Parse minimum thresholds
  const minMorphoHarvest = argv['min-morpho'] ? parseUnits(argv['min-morpho'], 18) : undefined
  const minWellHarvest = argv['min-well'] ? parseUnits(argv['min-well'], 18) : undefined

  const config = createConfig({
    dbUrl,
    rpcUrl,
    collectorPrivateKey,
    minMorphoHarvest,
    minWellHarvest,
    vaultFilter,
  })

  const format = argv.format as OutputFormat

  try {
    switch (command) {
      case 'dry-run': {
        console.log(chalk.blue('Fetching revenue data...'))
        const result = await dryRun(config)
        console.log(formatOutput(result, format))
        break
      }

      case 'harvest': {
        if (!collectorPrivateKey) {
          console.error(chalk.red('Error: REVENUE_COLLECTOR_PRIVATE_KEY is required for harvest'))
          process.exit(1)
        }
        console.log(chalk.blue('Executing harvest...'))
        const result = await harvest(config)
        console.log(chalk.green(`Harvested ${result.transactions.length} transactions`))
        console.log(`  MORPHO: ${result.harvested.morpho.toString()}`)
        console.log(`  WELL: ${result.harvested.well.toString()}`)
        if (result.errors.length > 0) {
          console.log(chalk.yellow(`Errors: ${result.errors.length}`))
          for (const err of result.errors) {
            console.log(`  ${err.vault}: ${err.error}`)
          }
        }
        break
      }

      case 'sweep': {
        if (!collectorPrivateKey) {
          console.error(chalk.red('Error: REVENUE_COLLECTOR_PRIVATE_KEY is required for sweep'))
          process.exit(1)
        }
        console.log(chalk.blue('Executing sweep...'))
        const result = await sweep(config)
        console.log(chalk.green(`Swept ${result.transactions.length} transactions`))
        console.log(`  MORPHO: ${result.swept.morpho.toString()}`)
        console.log(`  WELL: ${result.swept.well.toString()}`)
        if (result.skipped.length > 0) {
          console.log(chalk.yellow(`Skipped vaults: ${result.skipped.length}`))
          for (const skip of result.skipped) {
            console.log(`  ${skip.vault}: ${skip.reason}`)
          }
        }
        if (result.errors.length > 0) {
          console.log(chalk.yellow(`Errors: ${result.errors.length}`))
          for (const err of result.errors) {
            console.log(`  ${err.vault}: ${err.error}`)
          }
        }
        break
      }

      case 'fees-dry-run': {
        console.log(chalk.blue('Fetching fee distribution data...'))
        const result = await feesDryRun(config)
        console.log(formatFeesDryRun(result, format))
        break
      }

      case 'distribute-fees': {
        if (!collectorPrivateKey) {
          console.error(
            chalk.red('Error: REVENUE_COLLECTOR_PRIVATE_KEY is required for distribute-fees')
          )
          process.exit(1)
        }
        console.log(chalk.blue('Executing fee distribution...'))
        const result = await distributeFees(config)
        console.log(chalk.green(`Distributed fees for ${result.distributed.vaultCount} vaults`))
        console.log(`  Total shares redeemed: ${result.distributed.totalShares.toString()}`)
        if (result.skipped.length > 0) {
          console.log(chalk.yellow(`Skipped: ${result.skipped.length}`))
          for (const skip of result.skipped) {
            console.log(`  ${skip.vault}: ${skip.reason}`)
          }
        }
        if (result.errors.length > 0) {
          console.log(chalk.yellow(`Errors: ${result.errors.length}`))
          for (const err of result.errors) {
            console.log(`  ${err.vault}: ${err.error}`)
          }
        }
        break
      }

      case 'tvl': {
        console.log(chalk.blue('Fetching TVL data...'))
        const result = await tvl(config)
        console.log(formatTVL(result, format))
        break
      }

      default:
        console.error(chalk.red(`Unknown command: ${command}`))
        showHelp()
        process.exit(1)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error(chalk.red(`Error: ${message}`))
    process.exit(1)
  }
}

main()
