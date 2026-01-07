#!/usr/bin/env bun
import 'zx/globals'
import { parseUnits } from 'viem'
import { dryRun, harvest, sweep, createConfig, formatOutput } from '../src/index'
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
  dry-run   Display harvestable rewards and vault balances (read-only)
  harvest   Execute Merkl claim transactions
  sweep     Execute vault sweep transactions to revenue safe

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
`)
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

  // Parse vault filter (can be repeated)
  let vaultFilter: `0x${string}`[] | undefined
  if (argv.vault) {
    const vaults = Array.isArray(argv.vault) ? argv.vault : [argv.vault]
    vaultFilter = vaults.map((v: string) => v as `0x${string}`)
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
