import { baseMainnetClient, merklDistributorAddress } from '@my/wagmi'
import { bootstrap, isRetryableDBError } from '@my/workflows/utils'
import { ApplicationFailure, log, sleep } from '@temporalio/activity'
import { createWalletClient, http, type TransactionReceipt } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import { getRewardsConfig, REWARDS_ADDRESSES, type RewardsConfig } from './config'
import { getActiveVaults, insertRewardClaims } from './supabase'
import type { ClaimRecord, ClaimResult, MerklRewardsResponse, VaultRewards } from './types'

/**
 * Activity types for the rewards claim workflow.
 */
export interface RewardsClaimActivities {
  getActiveVaultsActivity: () => Promise<`0x${string}`[]>
  fetchClaimableRewardsActivity: (params: {
    vaults: `0x${string}`[]
  }) => Promise<VaultRewards[]>
  executeClaimActivity: (params: {
    claims: VaultRewards[]
  }) => Promise<ClaimResult>
  recordClaimsActivity: (params: {
    claims: ClaimRecord[]
  }) => Promise<void>
}

let cachedConfig: RewardsConfig | null = null

function getConfig(env: Record<string, string | undefined>): RewardsConfig {
  if (!cachedConfig) {
    cachedConfig = getRewardsConfig(env)
  }
  return cachedConfig
}

/**
 * Create all rewards claim activities.
 */
export function createRewardsClaimActivities(
  env: Record<string, string | undefined>
): RewardsClaimActivities {
  bootstrap(env)

  return {
    getActiveVaultsActivity: () => getActiveVaultsActivity(env),
    fetchClaimableRewardsActivity: (params) => fetchClaimableRewardsActivity(env, params),
    executeClaimActivity: (params) => executeClaimActivity(env, params),
    recordClaimsActivity: (params) => recordClaimsActivity(env, params),
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
 * Fetch rewards from Merkl API with rate limiting and threshold filtering.
 */
async function fetchClaimableRewardsActivity(
  env: Record<string, string | undefined>,
  { vaults }: { vaults: `0x${string}`[] }
): Promise<VaultRewards[]> {
  const config = getConfig(env)
  const results: VaultRewards[] = []
  const errors: { vault: string; error: string }[] = []

  log.info('Fetching claimable rewards for vaults', { vaultCount: vaults.length })

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
          log.warn('Failed to fetch rewards for vault', { vault, status: response.status })
          break // Exit retry loop, move to next vault
        }

        const data = (await response.json()) as MerklRewardsResponse

        const morphoReward = data[REWARDS_ADDRESSES.MORPHO_TOKEN.toLowerCase()]
        const wellReward = data[REWARDS_ADDRESSES.WELL_TOKEN.toLowerCase()]

        const morphoClaimable = morphoReward
          ? BigInt(morphoReward.amount) - BigInt(morphoReward.claimed)
          : 0n
        const wellClaimable = wellReward
          ? BigInt(wellReward.amount) - BigInt(wellReward.claimed)
          : 0n

        // Apply minimum thresholds - only include amounts that exceed configured minimums
        const morphoAboveThreshold = morphoClaimable >= config.minMorphoClaim
        const wellAboveThreshold = wellClaimable >= config.minWellClaim

        results.push({
          vault,
          morphoAmount: morphoAboveThreshold ? morphoClaimable : 0n,
          wellAmount: wellAboveThreshold ? wellClaimable : 0n,
          morphoProof: morphoAboveThreshold
            ? (morphoReward?.proofs ?? []).map((p) => p as `0x${string}`)
            : [],
          wellProof: wellAboveThreshold
            ? (wellReward?.proofs ?? []).map((p) => p as `0x${string}`)
            : [],
          hasClaimableRewards: morphoAboveThreshold || wellAboveThreshold,
        })
        break // Success - exit retry loop
      } catch (error) {
        retryCount++
        if (retryCount >= maxRetries) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          errors.push({ vault, error: errorMessage })
          log.error('Failed to fetch rewards after retries', { vault, error, retryCount })
        } else {
          log.warn('Error fetching rewards, retrying', { vault, error, retryCount })
          await sleep(config.merklApiDelayMs * retryCount)
        }
      }
    }
  }

  // Log summary of any errors for monitoring
  if (errors.length > 0) {
    log.warn('Some vaults failed to fetch rewards', { errorCount: errors.length, errors })
  }

  log.info('Completed fetching rewards', {
    totalVaults: vaults.length,
    successfulVaults: results.length,
    errorCount: errors.length,
    claimableVaults: results.filter((r) => r.hasClaimableRewards).length,
  })

  return results
}

/**
 * Build Merkl claim arrays from VaultRewards.
 */
function buildClaimArrays(claims: VaultRewards[]): {
  users: `0x${string}`[]
  tokens: `0x${string}`[]
  amounts: bigint[]
  proofs: `0x${string}`[][]
} {
  const users: `0x${string}`[] = []
  const tokens: `0x${string}`[] = []
  const amounts: bigint[] = []
  const proofs: `0x${string}`[][] = []

  for (const claim of claims) {
    if (claim.morphoAmount > 0n) {
      users.push(claim.vault)
      tokens.push(REWARDS_ADDRESSES.MORPHO_TOKEN as `0x${string}`)
      amounts.push(claim.morphoAmount)
      proofs.push(claim.morphoProof)
    }

    if (claim.wellAmount > 0n) {
      users.push(claim.vault)
      tokens.push(REWARDS_ADDRESSES.WELL_TOKEN as `0x${string}`)
      amounts.push(claim.wellAmount)
      proofs.push(claim.wellProof)
    }
  }

  return { users, tokens, amounts, proofs }
}

/**
 * Execute claim transactions with fallback to individual claims on batch failure.
 */
async function executeClaimActivity(
  env: Record<string, string | undefined>,
  { claims }: { claims: VaultRewards[] }
): Promise<ClaimResult> {
  const config = getConfig(env)
  const successful: ClaimRecord[] = []
  const errors: { vault: string; error: string }[] = []
  const transactions: `0x${string}`[] = []

  if (!config.claimerPrivateKey) {
    throw ApplicationFailure.nonRetryable(
      'REWARDS_CLAIMER_PRIVATE_KEY not configured',
      'CONFIG_ERROR'
    )
  }

  // Build arrays for batch claim
  const batchClaims = buildClaimArrays(claims)

  if (batchClaims.users.length === 0) {
    log.info('No claims to execute')
    return {
      transactions: [],
      totals: { morpho: 0n, well: 0n },
      successful: [],
      errors: [],
    }
  }

  // Create wallet client for EOA claimer
  const account = privateKeyToAccount(config.claimerPrivateKey as `0x${string}`)
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(base.rpcUrls.default.http[0]),
  })

  log.info('Executing claim transaction', {
    claimerAddress: account.address,
    claimCount: batchClaims.users.length,
    vaultCount: claims.length,
  })

  /**
   * Helper to get block timestamp from receipt.
   */
  async function getBlockTimestamp(receipt: TransactionReceipt): Promise<bigint> {
    const block = await baseMainnetClient.getBlock({ blockNumber: receipt.blockNumber })
    return block.timestamp
  }

  /**
   * Helper to record claims with tx metadata.
   */
  async function recordClaimsFromReceipt(
    claimsToRecord: VaultRewards[],
    receipt: TransactionReceipt
  ): Promise<void> {
    const blockTime = await getBlockTimestamp(receipt)

    for (const claim of claimsToRecord) {
      if (claim.morphoAmount > 0n) {
        successful.push({
          vault: claim.vault,
          token: REWARDS_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
          amount: claim.morphoAmount,
          txHash: receipt.transactionHash,
          blockNum: receipt.blockNumber,
          blockTime,
        })
      }
      if (claim.wellAmount > 0n) {
        successful.push({
          vault: claim.vault,
          token: REWARDS_ADDRESSES.WELL_TOKEN as `0x${string}`,
          amount: claim.wellAmount,
          txHash: receipt.transactionHash,
          blockNum: receipt.blockNumber,
          blockTime,
        })
      }
    }
  }

  // Attempt batch claim first
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
      args: [batchClaims.users, batchClaims.tokens, batchClaims.amounts, batchClaims.proofs],
    })

    log.info('Batch claim transaction submitted', { txHash })

    const receipt = await baseMainnetClient.waitForTransactionReceipt({ hash: txHash })

    if (receipt.status === 'success') {
      transactions.push(txHash)
      await recordClaimsFromReceipt(claims, receipt)
      log.info('Batch claim successful', { txHash, claimCount: successful.length })
    } else {
      throw new Error('Batch claim reverted')
    }
  } catch (batchError) {
    log.warn('Batch claim failed, falling back to individual claims', {
      error: batchError instanceof Error ? batchError.message : 'Unknown error',
    })

    // Fallback: try each vault individually
    for (const claim of claims) {
      const individualClaims = buildClaimArrays([claim])

      if (individualClaims.users.length === 0) continue

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
            individualClaims.users,
            individualClaims.tokens,
            individualClaims.amounts,
            individualClaims.proofs,
          ],
        })

        log.info('Individual claim transaction submitted', { vault: claim.vault, txHash })

        const receipt = await baseMainnetClient.waitForTransactionReceipt({ hash: txHash })

        if (receipt.status === 'success') {
          transactions.push(txHash)
          // Record this claim with its own tx metadata
          await recordClaimsFromReceipt([claim], receipt)
          log.info('Individual claim successful', { vault: claim.vault, txHash })
        } else {
          errors.push({ vault: claim.vault, error: 'Transaction reverted' })
          log.warn('Individual claim reverted', { vault: claim.vault })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ vault: claim.vault, error: errorMessage })
        log.error('Individual claim failed', { vault: claim.vault, error: errorMessage })
      }
    }
  }

  const result: ClaimResult = {
    transactions,
    totals: {
      morpho: successful
        .filter((s) => s.token.toLowerCase() === REWARDS_ADDRESSES.MORPHO_TOKEN.toLowerCase())
        .reduce((sum, s) => sum + s.amount, 0n),
      well: successful
        .filter((s) => s.token.toLowerCase() === REWARDS_ADDRESSES.WELL_TOKEN.toLowerCase())
        .reduce((sum, s) => sum + s.amount, 0n),
    },
    successful,
    errors,
  }

  log.info('Claim activity completed', {
    transactionCount: transactions.length,
    successfulClaims: successful.length,
    errorCount: errors.length,
    totalMorpho: result.totals.morpho.toString(),
    totalWell: result.totals.well.toString(),
  })

  return result
}

/**
 * Record successful claims in the database.
 */
async function recordClaimsActivity(
  _env: Record<string, string | undefined>,
  { claims }: { claims: ClaimRecord[] }
): Promise<void> {
  if (claims.length === 0) {
    log.info('No claims to record')
    return
  }

  log.info('Recording claims in database', { claimCount: claims.length })

  try {
    await insertRewardClaims(claims)
    log.info('Successfully recorded claims', { claimCount: claims.length })
  } catch (error) {
    log.error('Failed to record claims', { error })
    if (isRetryableDBError(error)) {
      throw ApplicationFailure.retryable('Database connection error, retrying...', 'DB_ERROR', {
        error,
      })
    }
    throw ApplicationFailure.nonRetryable('Failed to record claims in database', 'DB_ERROR', {
      error,
    })
  }
}
