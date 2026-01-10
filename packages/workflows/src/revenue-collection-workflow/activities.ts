import {
  REVENUE_ADDRESSES,
  type HarvestRecord,
  type RevenueError,
  type SweepRecord,
  type VaultBalances,
  type VaultRevenue,
  // Library functions
  getActiveVaults as getActiveVaultsFromDb,
  fetchHarvestableRevenue,
  getVaultBalances,
  executeHarvest,
  executeSweep,
} from '@my/send-earn'
import { bootstrap, isRetryableDBError } from '@my/workflows/utils'
import { ApplicationFailure, log } from '@temporalio/activity'
import { getRevenueConfig, type RevenueConfig } from './config'
import { insertHarvestRecords, insertSweepRecords } from './supabase'
import type { HarvestResult, SweepResult } from './types'

/**
 * Activity types for the revenue collection workflow.
 */
export interface RevenueCollectionActivities {
  getActiveVaultsActivity: () => Promise<`0x${string}`[]>
  fetchHarvestableRevenueActivity: (params: {
    vaults: `0x${string}`[]
  }) => Promise<VaultRevenue[]>
  getVaultBalancesActivity: (params: {
    vaults: `0x${string}`[]
  }) => Promise<VaultBalances[]>
  harvestRevenueActivity: (params: {
    vaultRevenue: VaultRevenue[]
  }) => Promise<HarvestResult>
  sweepToRevenueActivity: (params: {
    vaults: `0x${string}`[]
    tokens: `0x${string}`[]
  }) => Promise<SweepResult>
  recordHarvestActivity: (params: {
    records: HarvestRecord[]
  }) => Promise<void>
  recordSweepActivity: (params: {
    records: SweepRecord[]
  }) => Promise<void>
}

let cachedConfig: RevenueConfig | null = null

function getConfig(env: Record<string, string | undefined>): RevenueConfig {
  if (!cachedConfig) {
    cachedConfig = getRevenueConfig(env)
  }
  return cachedConfig
}

/**
 * Create all revenue collection activities.
 */
export function createRevenueCollectionActivities(
  env: Record<string, string | undefined>
): RevenueCollectionActivities {
  bootstrap(env)

  return {
    getActiveVaultsActivity: () => getActiveVaultsActivity(env),
    fetchHarvestableRevenueActivity: (params) => fetchHarvestableRevenueActivity(env, params),
    getVaultBalancesActivity: (params) => getVaultBalancesActivity(env, params),
    harvestRevenueActivity: (params) => harvestRevenueActivity(env, params),
    sweepToRevenueActivity: (params) => sweepToRevenueActivity(env, params),
    recordHarvestActivity: (params) => recordHarvestActivity(env, params),
    recordSweepActivity: (params) => recordSweepActivity(env, params),
  }
}

/**
 * Query database for all active Send Earn vaults.
 * Delegates to @my/send-earn getActiveVaults.
 */
async function getActiveVaultsActivity(
  env: Record<string, string | undefined>
): Promise<`0x${string}`[]> {
  const config = getConfig(env)
  log.info('Fetching active vaults from database')

  try {
    const vaults = await getActiveVaultsFromDb(config.dbUrl)
    log.info('Successfully fetched active vaults', { count: vaults.length })
    return vaults
  } catch (error) {
    log.error('Failed to fetch active vaults', { error })
    if (isRetryableDBError(error)) {
      throw ApplicationFailure.retryable('Database connection error, retrying...', 'DB_ERROR', {
        error,
      })
    }
    throw ApplicationFailure.nonRetryable('Failed to fetch active vaults', 'DB_ERROR', { error })
  }
}

/**
 * Fetch harvestable revenue from Merkl API with rate limiting and threshold filtering.
 * Delegates to @my/send-earn fetchHarvestableRevenue.
 */
async function fetchHarvestableRevenueActivity(
  env: Record<string, string | undefined>,
  { vaults }: { vaults: `0x${string}`[] }
): Promise<VaultRevenue[]> {
  const config = getConfig(env)
  log.info('Fetching harvestable revenue for vaults', { vaultCount: vaults.length })

  try {
    const results = await fetchHarvestableRevenue(config, vaults)
    log.info('Completed fetching revenue', {
      totalVaults: vaults.length,
      successfulVaults: results.length,
      harvestableVaults: results.filter((r) => r.hasHarvestableRevenue).length,
    })
    return results
  } catch (error) {
    log.error('Failed to fetch harvestable revenue', { error })
    throw ApplicationFailure.retryable('Merkl API error, retrying...', 'MERKL_API_ERROR', {
      error,
    })
  }
}

/**
 * Get current MORPHO and WELL balances for vaults.
 * Delegates to @my/send-earn getVaultBalances.
 */
async function getVaultBalancesActivity(
  env: Record<string, string | undefined>,
  { vaults }: { vaults: `0x${string}`[] }
): Promise<VaultBalances[]> {
  const config = getConfig(env)
  log.info('Fetching vault balances', { vaultCount: vaults.length })

  try {
    const results = await getVaultBalances(config, vaults)
    log.info('Completed fetching vault balances', { vaultCount: results.length })
    return results
  } catch (error) {
    log.error('Failed to fetch vault balances', { error })
    throw ApplicationFailure.retryable('RPC error fetching balances, retrying...', 'RPC_ERROR', {
      error,
    })
  }
}

/**
 * Execute harvest transactions (Merkl.claim).
 * Delegates to @my/send-earn executeHarvest.
 * FAIL FAST: If batch claim fails (e.g., stale proofs), abort the entire batch.
 */
async function harvestRevenueActivity(
  env: Record<string, string | undefined>,
  { vaultRevenue }: { vaultRevenue: VaultRevenue[] }
): Promise<HarvestResult> {
  const config = getConfig(env)

  if (!config.collectorPrivateKey) {
    throw ApplicationFailure.nonRetryable(
      'REVENUE_COLLECTOR_PRIVATE_KEY not configured',
      'CONFIG_ERROR'
    )
  }

  const harvestableVaults = vaultRevenue.filter((v) => v.hasHarvestableRevenue)
  if (harvestableVaults.length === 0) {
    log.info('No revenue to harvest')
    return {
      transactions: [],
      totals: { morpho: 0n, well: 0n },
      successful: [],
      errors: [],
    }
  }

  log.info('Executing harvest', {
    vaultCount: harvestableVaults.length,
  })

  try {
    const result = await executeHarvest(config, harvestableVaults)

    // Transform result to match workflow types
    const successful: HarvestRecord[] = result.transactions.map((tx) => ({
      vault: tx.vault,
      token: tx.token,
      amount: tx.amount,
      txHash: tx.txHash,
      blockNum: tx.blockNum,
      blockTime: tx.blockTime,
    }))

    const transactions = [...new Set(result.transactions.map((tx) => tx.txHash))]

    log.info('Harvest activity completed', {
      transactionCount: transactions.length,
      successfulHarvests: successful.length,
      totalMorpho: result.harvested.morpho.toString(),
      totalWell: result.harvested.well.toString(),
    })

    return {
      transactions,
      totals: result.harvested,
      successful,
      errors: result.errors,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    log.error('Harvest failed', { error: errorMessage })

    // Check if it's a stale proof / revert error (non-retryable)
    if (errorMessage.includes('reverted') || errorMessage.includes('stale')) {
      throw ApplicationFailure.nonRetryable(
        `Harvest batch failed: ${errorMessage}. Proofs may be stale. Re-run workflow with fresh proofs.`,
        'HARVEST_REVERTED',
        { error: errorMessage }
      )
    }

    // Other errors may be retryable (network issues, etc.)
    throw ApplicationFailure.retryable(`Harvest failed: ${errorMessage}`, 'HARVEST_ERROR', {
      error: errorMessage,
    })
  }
}

/**
 * Sweep tokens from vaults to revenue safe via SendEarn.collect().
 * Delegates to @my/send-earn executeSweep.
 * CRITICAL: Reads FRESH balances internally after harvest.
 */
async function sweepToRevenueActivity(
  env: Record<string, string | undefined>,
  { vaults }: { vaults: `0x${string}`[]; tokens: `0x${string}`[] }
): Promise<SweepResult> {
  const config = getConfig(env)

  if (!config.collectorPrivateKey) {
    throw ApplicationFailure.nonRetryable(
      'REVENUE_COLLECTOR_PRIVATE_KEY not configured',
      'CONFIG_ERROR'
    )
  }

  log.info('Sweeping revenue from vaults', {
    vaultCount: vaults.length,
    revenueSafe: REVENUE_ADDRESSES.REVENUE_SAFE,
  })

  try {
    const result = await executeSweep(config, vaults)

    // Transform result to match workflow types
    const successful: SweepRecord[] = result.transactions.map((tx) => ({
      vault: tx.vault,
      token: tx.token,
      amount: tx.amount,
      destination: REVENUE_ADDRESSES.REVENUE_SAFE as `0x${string}`,
      txHash: tx.txHash,
      blockNum: tx.blockNum,
      blockTime: tx.blockTime,
    }))

    const transactions = [...new Set(result.transactions.map((tx) => tx.txHash))]

    log.info('Sweep activity completed', {
      transactionCount: transactions.length,
      successfulSweeps: successful.length,
      skippedCount: result.skipped.length,
      errorCount: result.errors.length,
      totalMorpho: result.swept.morpho.toString(),
      totalWell: result.swept.well.toString(),
    })

    return {
      transactions,
      totals: result.swept,
      successful,
      errors: result.errors,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    log.error('Sweep failed', { error: errorMessage })
    throw ApplicationFailure.retryable(`Sweep failed: ${errorMessage}`, 'SWEEP_ERROR', {
      error: errorMessage,
    })
  }
}

/**
 * Record successful harvest records in the database.
 */
async function recordHarvestActivity(
  _env: Record<string, string | undefined>,
  { records }: { records: HarvestRecord[] }
): Promise<void> {
  if (records.length === 0) {
    log.info('No harvest records to record')
    return
  }

  log.info('Recording harvest records in database', { count: records.length })

  try {
    await insertHarvestRecords(records)
    log.info('Successfully recorded harvest records', { count: records.length })
  } catch (error) {
    log.error('Failed to record harvest records', { error })
    if (isRetryableDBError(error)) {
      throw ApplicationFailure.retryable('Database connection error, retrying...', 'DB_ERROR', {
        error,
      })
    }
    throw ApplicationFailure.nonRetryable(
      'Failed to record harvest records in database',
      'DB_ERROR',
      {
        error,
      }
    )
  }
}

/**
 * Record successful sweep records in the database.
 */
async function recordSweepActivity(
  _env: Record<string, string | undefined>,
  { records }: { records: SweepRecord[] }
): Promise<void> {
  if (records.length === 0) {
    log.info('No sweep records to record')
    return
  }

  log.info('Recording sweep records in database', { count: records.length })

  try {
    await insertSweepRecords(records)
    log.info('Successfully recorded sweep records', { count: records.length })
  } catch (error) {
    log.error('Failed to record sweep records', { error })
    if (isRetryableDBError(error)) {
      throw ApplicationFailure.retryable('Database connection error, retrying...', 'DB_ERROR', {
        error,
      })
    }
    throw ApplicationFailure.nonRetryable(
      'Failed to record sweep records in database',
      'DB_ERROR',
      {
        error,
      }
    )
  }
}
