import {
  baseMainnetClient,
  merklDistributorAddress,
  sendEarnAbi,
  sendEarnRevenueSafeAddress,
  erc20Abi,
} from '@my/wagmi'
import { bootstrap, isRetryableDBError } from '@my/workflows/utils'
import { ApplicationFailure, log, sleep } from '@temporalio/activity'
import { createWalletClient, http, type TransactionReceipt } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import { getRevenueConfig, REVENUE_ADDRESSES, type RevenueConfig } from './config'
import { getActiveVaults, insertHarvestRecords, insertSweepRecords } from './supabase'
import type {
  HarvestRecord,
  HarvestResult,
  MerklRewardsResponse,
  RevenueError,
  SweepRecord,
  SweepResult,
  VaultBalances,
  VaultRevenue,
} from './types'

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
 */
async function getActiveVaultsActivity(
  _env: Record<string, string | undefined>
): Promise<`0x${string}`[]> {
  log.info('Fetching active vaults from database')

  try {
    const vaults = await getActiveVaults()
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
 */
async function fetchHarvestableRevenueActivity(
  env: Record<string, string | undefined>,
  { vaults }: { vaults: `0x${string}`[] }
): Promise<VaultRevenue[]> {
  const config = getConfig(env)
  const results: VaultRevenue[] = []
  const errors: { vault: string; error: string }[] = []

  log.info('Fetching harvestable revenue for vaults', { vaultCount: vaults.length })

  for (let i = 0; i < vaults.length; i++) {
    const vault = vaults[i]
    if (!vault) continue // TypeScript guard for array access

    // Rate limiting: delay before EVERY request (except first) to respect 10 req/s limit
    if (i > 0) {
      await sleep(config.merklApiDelayMs)
    }

    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const url = `${config.merklApiBaseUrl}/users/${vault}/rewards?chainId=${config.chainId}`
        const response = await fetch(url)

        if (response.status === 429) {
          // Rate limited - exponential backoff and retry same vault
          retryCount++
          if (retryCount >= maxRetries) {
            // Max retries exhausted on 429 - record error and move on
            errors.push({ vault, error: 'Rate limited (429) after max retries' })
            log.error('Rate limited by Merkl API, max retries exhausted', { vault, retryCount })
            break // Exit retry loop, move to next vault
          }
          const backoffMs = config.merklApiDelayMs * 2 ** retryCount * 10
          log.warn('Rate limited by Merkl API, backing off', { vault, retryCount, backoffMs })
          await sleep(backoffMs)
          continue // Retry same vault
        }

        if (!response.ok) {
          // Non-retryable error - record and move on
          errors.push({ vault, error: `HTTP ${response.status}` })
          log.warn('Failed to fetch revenue for vault', { vault, status: response.status })
          break // Exit retry loop, move to next vault
        }

        const data = (await response.json()) as MerklRewardsResponse

        const morphoReward = data[REVENUE_ADDRESSES.MORPHO_TOKEN.toLowerCase()]
        const wellReward = data[REVENUE_ADDRESSES.WELL_TOKEN.toLowerCase()]

        const morphoHarvestable = morphoReward
          ? BigInt(morphoReward.amount) - BigInt(morphoReward.claimed)
          : 0n
        const wellHarvestable = wellReward
          ? BigInt(wellReward.amount) - BigInt(wellReward.claimed)
          : 0n

        // Apply minimum thresholds - only include amounts that exceed configured minimums
        const morphoAboveThreshold = morphoHarvestable >= config.minMorphoHarvest
        const wellAboveThreshold = wellHarvestable >= config.minWellHarvest

        results.push({
          vault,
          morphoAmount: morphoAboveThreshold ? morphoHarvestable : 0n,
          wellAmount: wellAboveThreshold ? wellHarvestable : 0n,
          morphoProof: morphoAboveThreshold
            ? (morphoReward?.proofs ?? []).map((p) => p as `0x${string}`)
            : [],
          wellProof: wellAboveThreshold
            ? (wellReward?.proofs ?? []).map((p) => p as `0x${string}`)
            : [],
          hasHarvestableRevenue: morphoAboveThreshold || wellAboveThreshold,
        })
        break // Success - exit retry loop
      } catch (error) {
        retryCount++
        if (retryCount >= maxRetries) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ vault, error: errorMessage })
          log.error('Failed to fetch revenue after retries', { vault, error, retryCount })
        } else {
          log.warn('Error fetching revenue, retrying', { vault, error, retryCount })
          await sleep(config.merklApiDelayMs * retryCount)
        }
      }
    }
  }

  // Log summary of any errors for monitoring
  if (errors.length > 0) {
    log.warn('Some vaults failed to fetch revenue', { errorCount: errors.length, errors })
  }

  log.info('Completed fetching revenue', {
    totalVaults: vaults.length,
    successfulVaults: results.length,
    errorCount: errors.length,
    harvestableVaults: results.filter((r) => r.hasHarvestableRevenue).length,
  })

  return results
}

/**
 * Get current MORPHO and WELL balances for vaults.
 * Used for dry run simulation only - sweep reads balances internally after harvest.
 */
async function getVaultBalancesActivity(
  _env: Record<string, string | undefined>,
  { vaults }: { vaults: `0x${string}`[] }
): Promise<VaultBalances[]> {
  log.info('Fetching vault balances', { vaultCount: vaults.length })

  const results: VaultBalances[] = []

  for (const vault of vaults) {
    try {
      const [morphoBalance, wellBalance] = await Promise.all([
        baseMainnetClient.readContract({
          address: REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [vault],
        }),
        baseMainnetClient.readContract({
          address: REVENUE_ADDRESSES.WELL_TOKEN as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [vault],
        }),
      ])

      results.push({
        vault,
        morphoBalance,
        wellBalance,
      })
    } catch (error) {
      log.warn('Failed to fetch balances for vault', { vault, error })
      results.push({
        vault,
        morphoBalance: 0n,
        wellBalance: 0n,
      })
    }
  }

  log.info('Completed fetching vault balances', { vaultCount: results.length })
  return results
}

/**
 * Build Merkl claim arrays from VaultRevenue.
 */
function buildHarvestArrays(vaultRevenue: VaultRevenue[]): {
  users: `0x${string}`[]
  tokens: `0x${string}`[]
  amounts: bigint[]
  proofs: `0x${string}`[][]
} {
  const users: `0x${string}`[] = []
  const tokens: `0x${string}`[] = []
  const amounts: bigint[] = []
  const proofs: `0x${string}`[][] = []

  for (const revenue of vaultRevenue) {
    if (revenue.morphoAmount > 0n) {
      users.push(revenue.vault)
      tokens.push(REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`)
      amounts.push(revenue.morphoAmount)
      proofs.push(revenue.morphoProof)
    }

    if (revenue.wellAmount > 0n) {
      users.push(revenue.vault)
      tokens.push(REVENUE_ADDRESSES.WELL_TOKEN as `0x${string}`)
      amounts.push(revenue.wellAmount)
      proofs.push(revenue.wellProof)
    }
  }

  return { users, tokens, amounts, proofs }
}

/**
 * Execute harvest transactions (Merkl.claim) with fallback to individual claims on batch failure.
 */
async function harvestRevenueActivity(
  env: Record<string, string | undefined>,
  { vaultRevenue }: { vaultRevenue: VaultRevenue[] }
): Promise<HarvestResult> {
  const config = getConfig(env)
  const successful: HarvestRecord[] = []
  const errors: RevenueError[] = []
  const transactions: `0x${string}`[] = []

  if (!config.collectorPrivateKey) {
    throw ApplicationFailure.nonRetryable(
      'REVENUE_COLLECTOR_PRIVATE_KEY not configured',
      'CONFIG_ERROR'
    )
  }

  // Build arrays for batch harvest
  const batchHarvest = buildHarvestArrays(vaultRevenue)

  if (batchHarvest.users.length === 0) {
    log.info('No revenue to harvest')
    return {
      transactions: [],
      totals: { morpho: 0n, well: 0n },
      successful: [],
      errors: [],
    }
  }

  // Create wallet client for EOA collector
  const account = privateKeyToAccount(config.collectorPrivateKey as `0x${string}`)
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(base.rpcUrls.default.http[0]),
  })

  log.info('Executing harvest transaction', {
    collectorAddress: account.address,
    harvestCount: batchHarvest.users.length,
    vaultCount: vaultRevenue.length,
  })

  /**
   * Helper to get block timestamp from receipt.
   */
  async function getBlockTimestamp(receipt: TransactionReceipt): Promise<bigint> {
    const block = await baseMainnetClient.getBlock({ blockNumber: receipt.blockNumber })
    return block.timestamp
  }

  /**
   * Helper to record harvests with tx metadata.
   */
  async function recordHarvestsFromReceipt(
    harvestsToRecord: VaultRevenue[],
    receipt: TransactionReceipt
  ): Promise<void> {
    const blockTime = await getBlockTimestamp(receipt)

    for (const revenue of harvestsToRecord) {
      if (revenue.morphoAmount > 0n) {
        successful.push({
          vault: revenue.vault,
          token: REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
          amount: revenue.morphoAmount,
          txHash: receipt.transactionHash,
          blockNum: receipt.blockNumber,
          blockTime,
        })
      }
      if (revenue.wellAmount > 0n) {
        successful.push({
          vault: revenue.vault,
          token: REVENUE_ADDRESSES.WELL_TOKEN as `0x${string}`,
          amount: revenue.wellAmount,
          txHash: receipt.transactionHash,
          blockNum: receipt.blockNumber,
          blockTime,
        })
      }
    }
  }

  // Attempt batch harvest first
  try {
    const txHash = await walletClient.writeContract({
      address: merklDistributorAddress[base.id],
      abi: [
        {
          type: 'function',
          name: 'claim',
          inputs: [
            { name: 'users', type: 'address[]' },
            { name: 'tokens', type: 'address[]' },
            { name: 'amounts', type: 'uint256[]' },
            { name: 'proofs', type: 'bytes32[][]' },
          ],
          outputs: [],
          stateMutability: 'nonpayable',
        },
      ] as const,
      functionName: 'claim',
      args: [batchHarvest.users, batchHarvest.tokens, batchHarvest.amounts, batchHarvest.proofs],
    })

    log.info('Batch harvest transaction submitted', { txHash })

    const receipt = await baseMainnetClient.waitForTransactionReceipt({ hash: txHash })

    if (receipt.status === 'success') {
      transactions.push(txHash)
      await recordHarvestsFromReceipt(vaultRevenue, receipt)
      log.info('Batch harvest successful', { txHash, harvestCount: successful.length })
    } else {
      throw new Error('Batch harvest reverted')
    }
  } catch (batchError) {
    log.warn('Batch harvest failed, falling back to individual harvests', {
      error: batchError instanceof Error ? batchError.message : 'Unknown error',
    })

    // Fallback: try each vault individually
    for (const revenue of vaultRevenue) {
      const individualHarvest = buildHarvestArrays([revenue])

      if (individualHarvest.users.length === 0) continue

      try {
        const txHash = await walletClient.writeContract({
          address: merklDistributorAddress[base.id],
          abi: [
            {
              type: 'function',
              name: 'claim',
              inputs: [
                { name: 'users', type: 'address[]' },
                { name: 'tokens', type: 'address[]' },
                { name: 'amounts', type: 'uint256[]' },
                { name: 'proofs', type: 'bytes32[][]' },
              ],
              outputs: [],
              stateMutability: 'nonpayable',
            },
          ] as const,
          functionName: 'claim',
          args: [
            individualHarvest.users,
            individualHarvest.tokens,
            individualHarvest.amounts,
            individualHarvest.proofs,
          ],
        })

        log.info('Individual harvest transaction submitted', { vault: revenue.vault, txHash })

        const receipt = await baseMainnetClient.waitForTransactionReceipt({ hash: txHash })

        if (receipt.status === 'success') {
          transactions.push(txHash)
          await recordHarvestsFromReceipt([revenue], receipt)
          log.info('Individual harvest successful', { vault: revenue.vault, txHash })
        } else {
          errors.push({ vault: revenue.vault, step: 'harvest', error: 'Transaction reverted' })
          log.warn('Individual harvest reverted', { vault: revenue.vault })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ vault: revenue.vault, step: 'harvest', error: errorMessage })
        log.error('Individual harvest failed', { vault: revenue.vault, error: errorMessage })
      }
    }
  }

  const result: HarvestResult = {
    transactions,
    totals: {
      morpho: successful
        .filter((s) => s.token.toLowerCase() === REVENUE_ADDRESSES.MORPHO_TOKEN.toLowerCase())
        .reduce((sum, s) => sum + s.amount, 0n),
      well: successful
        .filter((s) => s.token.toLowerCase() === REVENUE_ADDRESSES.WELL_TOKEN.toLowerCase())
        .reduce((sum, s) => sum + s.amount, 0n),
    },
    successful,
    errors,
  }

  log.info('Harvest activity completed', {
    transactionCount: transactions.length,
    successfulHarvests: successful.length,
    errorCount: errors.length,
    totalMorpho: result.totals.morpho.toString(),
    totalWell: result.totals.well.toString(),
  })

  return result
}

/**
 * Sweep tokens from vaults to revenue safe via SendEarn.collect().
 * CRITICAL: Reads FRESH balances internally after harvest - do not pass pre-harvest balances.
 */
async function sweepToRevenueActivity(
  env: Record<string, string | undefined>,
  { vaults, tokens }: { vaults: `0x${string}`[]; tokens: `0x${string}`[] }
): Promise<SweepResult> {
  const config = getConfig(env)
  const successful: SweepRecord[] = []
  const errors: RevenueError[] = []
  const transactions: `0x${string}`[] = []

  if (!config.collectorPrivateKey) {
    throw ApplicationFailure.nonRetryable(
      'REVENUE_COLLECTOR_PRIVATE_KEY not configured',
      'CONFIG_ERROR'
    )
  }

  const revenueSafe = sendEarnRevenueSafeAddress[base.id]

  // Create wallet client for EOA collector
  const account = privateKeyToAccount(config.collectorPrivateKey as `0x${string}`)
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(base.rpcUrls.default.http[0]),
  })

  log.info('Sweeping revenue from vaults', {
    collectorAddress: account.address,
    vaultCount: vaults.length,
    tokenCount: tokens.length,
    revenueSafe,
  })

  for (const vault of vaults) {
    // Safety check: Verify collections address matches revenue safe
    try {
      const collections = await baseMainnetClient.readContract({
        address: vault,
        abi: sendEarnAbi,
        functionName: 'collections',
      })

      if (collections.toLowerCase() !== revenueSafe.toLowerCase()) {
        errors.push({
          vault,
          step: 'sweep',
          error: `Collections address mismatch: ${collections} !== ${revenueSafe}`,
        })
        log.error('Collections address mismatch, skipping vault', {
          vault,
          collections,
          expected: revenueSafe,
        })
        continue // Skip this vault, continue with others
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push({ vault, step: 'sweep', error: `Failed to read collections: ${errorMessage}` })
      log.error('Failed to read collections address', { vault, error: errorMessage })
      continue
    }

    for (const token of tokens) {
      // Read FRESH balance (after harvest)
      let balance: bigint
      try {
        balance = await baseMainnetClient.readContract({
          address: token,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [vault],
        })
      } catch (error) {
        log.warn('Failed to read token balance, skipping', { vault, token, error })
        continue
      }

      if (balance === 0n) {
        log.debug('Zero balance, skipping', { vault, token })
        continue
      }

      try {
        const txHash = await walletClient.writeContract({
          address: vault,
          abi: sendEarnAbi,
          functionName: 'collect',
          args: [token],
        })

        log.info('Sweep transaction submitted', {
          vault,
          token,
          txHash,
          balance: balance.toString(),
        })

        const receipt = await baseMainnetClient.waitForTransactionReceipt({ hash: txHash })

        if (receipt.status === 'success') {
          transactions.push(txHash)
          const block = await baseMainnetClient.getBlock({ blockNumber: receipt.blockNumber })

          successful.push({
            vault,
            token,
            amount: balance,
            destination: revenueSafe,
            txHash: receipt.transactionHash,
            blockNum: receipt.blockNumber,
            blockTime: block.timestamp,
          })
          log.info('Sweep successful', { vault, token, txHash, amount: balance.toString() })
        } else {
          errors.push({ vault, step: 'sweep', error: `Transaction reverted for token ${token}` })
          log.warn('Sweep transaction reverted', { vault, token })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ vault, step: 'sweep', error: `${token}: ${errorMessage}` })
        log.error('Sweep failed', { vault, token, error: errorMessage })
      }
    }
  }

  const result: SweepResult = {
    transactions,
    totals: {
      morpho: successful
        .filter((s) => s.token.toLowerCase() === REVENUE_ADDRESSES.MORPHO_TOKEN.toLowerCase())
        .reduce((sum, s) => sum + s.amount, 0n),
      well: successful
        .filter((s) => s.token.toLowerCase() === REVENUE_ADDRESSES.WELL_TOKEN.toLowerCase())
        .reduce((sum, s) => sum + s.amount, 0n),
    },
    successful,
    errors,
  }

  log.info('Sweep activity completed', {
    transactionCount: transactions.length,
    successfulSweeps: successful.length,
    errorCount: errors.length,
    totalMorpho: result.totals.morpho.toString(),
    totalWell: result.totals.well.toString(),
  })

  return result
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
