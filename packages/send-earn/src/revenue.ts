import { parseUnits } from 'viem'
import { getActiveVaults } from './db'
import { fetchHarvestableRevenue } from './merkl'
import { getVaultBalances, executeHarvest, executeSweep } from './vaults'
import type {
  RevenueConfig,
  DryRunResult,
  HarvestResult,
  SweepResult,
  VaultRevenue,
  VaultBalances,
} from './types'

/**
 * Default configuration values.
 */
export const DEFAULT_CONFIG = {
  minMorphoHarvest: parseUnits('1', 18), // 1 MORPHO
  minWellHarvest: parseUnits('10', 18), // 10 WELL
  merklApiDelayMs: 100, // 10 req/s max
  merklApiTimeoutMs: 30000, // 30s timeout
  merklApiBaseUrl: 'https://api.merkl.xyz/v4',
  chainId: 8453, // Base mainnet
}

/**
 * Create a complete config from partial options.
 */
export function createConfig(options: {
  dbUrl: string
  rpcUrl: string
  collectorPrivateKey?: string
  minMorphoHarvest?: bigint
  minWellHarvest?: bigint
  merklApiDelayMs?: number
  merklApiTimeoutMs?: number
  merklApiBaseUrl?: string
  chainId?: number
  vaultFilter?: `0x${string}`[]
}): RevenueConfig {
  return {
    dbUrl: options.dbUrl,
    rpcUrl: options.rpcUrl,
    collectorPrivateKey: options.collectorPrivateKey,
    minMorphoHarvest: options.minMorphoHarvest ?? DEFAULT_CONFIG.minMorphoHarvest,
    minWellHarvest: options.minWellHarvest ?? DEFAULT_CONFIG.minWellHarvest,
    merklApiDelayMs: options.merklApiDelayMs ?? DEFAULT_CONFIG.merklApiDelayMs,
    merklApiTimeoutMs: options.merklApiTimeoutMs ?? DEFAULT_CONFIG.merklApiTimeoutMs,
    merklApiBaseUrl: options.merklApiBaseUrl ?? DEFAULT_CONFIG.merklApiBaseUrl,
    chainId: options.chainId ?? DEFAULT_CONFIG.chainId,
    vaultFilter: options.vaultFilter,
  }
}

/**
 * Calculate totals from vault revenue and balances.
 */
function calculateTotals(
  vaults: VaultRevenue[],
  balances: VaultBalances[]
): DryRunResult['totals'] {
  const harvestable = {
    morpho: vaults.reduce((sum, v) => sum + v.morphoAmount, 0n),
    well: vaults.reduce((sum, v) => sum + v.wellAmount, 0n),
  }

  const vaultBalances = {
    morpho: balances.reduce((sum, b) => sum + b.morphoBalance, 0n),
    well: balances.reduce((sum, b) => sum + b.wellBalance, 0n),
  }

  return {
    harvestable,
    vaultBalances,
    sweepable: {
      morpho: harvestable.morpho + vaultBalances.morpho,
      well: harvestable.well + vaultBalances.well,
    },
  }
}

/**
 * Dry run: fetch harvestable amounts and vault balances without executing transactions.
 */
export async function dryRun(config: RevenueConfig): Promise<DryRunResult> {
  // Use vault filter directly if specified, otherwise get from database
  let vaults: `0x${string}`[]
  if (config.vaultFilter && config.vaultFilter.length > 0) {
    // Use provided vaults directly (skip database query)
    vaults = config.vaultFilter
  } else {
    // Get active vaults from database
    vaults = await getActiveVaults(config.dbUrl)
  }

  if (vaults.length === 0) {
    return {
      vaults: [],
      balances: [],
      totals: {
        harvestable: { morpho: 0n, well: 0n },
        vaultBalances: { morpho: 0n, well: 0n },
        sweepable: { morpho: 0n, well: 0n },
      },
    }
  }

  // Fetch harvestable revenue from Merkl API
  const vaultRevenue = await fetchHarvestableRevenue(config, vaults)

  // Get current vault balances
  const balances = await getVaultBalances(config, vaults)

  // Calculate totals
  const totals = calculateTotals(vaultRevenue, balances)

  return { vaults: vaultRevenue, balances, totals }
}

/**
 * Execute harvest: claim rewards from Merkl distributor.
 */
export async function harvest(config: RevenueConfig): Promise<HarvestResult> {
  // Use vault filter directly if specified, otherwise get from database
  let vaults: `0x${string}`[]
  if (config.vaultFilter && config.vaultFilter.length > 0) {
    // Use provided vaults directly (skip database query)
    vaults = config.vaultFilter
  } else {
    // Get active vaults from database
    vaults = await getActiveVaults(config.dbUrl)
  }

  if (vaults.length === 0) {
    return { harvested: { morpho: 0n, well: 0n }, transactions: [], errors: [] }
  }

  // Fetch harvestable revenue from Merkl API
  const vaultRevenue = await fetchHarvestableRevenue(config, vaults)

  // Filter to only vaults with harvestable revenue
  const harvestable = vaultRevenue.filter((v) => v.hasHarvestableRevenue)

  if (harvestable.length === 0) {
    console.log('No vaults have harvestable revenue above thresholds')
    return { harvested: { morpho: 0n, well: 0n }, transactions: [], errors: [] }
  }

  // Execute harvest transactions
  return executeHarvest(config, harvestable)
}

/**
 * Execute sweep: move tokens from vaults to revenue safe.
 */
export async function sweep(config: RevenueConfig): Promise<SweepResult> {
  // Use vault filter directly if specified, otherwise get from database
  let vaults: `0x${string}`[]
  if (config.vaultFilter && config.vaultFilter.length > 0) {
    // Use provided vaults directly (skip database query)
    vaults = config.vaultFilter
  } else {
    // Get active vaults from database
    vaults = await getActiveVaults(config.dbUrl)
  }

  if (vaults.length === 0) {
    return { swept: { morpho: 0n, well: 0n }, transactions: [], skipped: [], errors: [] }
  }

  // Execute sweep transactions
  return executeSweep(config, vaults)
}
