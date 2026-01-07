import type { MerklRewardsResponse, RevenueConfig, VaultRevenue } from './types'
import { REVENUE_ADDRESSES } from './types'

/**
 * Delay helper for rate limiting.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch harvestable revenue from Merkl API for a list of vaults.
 */
export async function fetchHarvestableRevenue(
  config: RevenueConfig,
  vaults: `0x${string}`[]
): Promise<VaultRevenue[]> {
  const results: VaultRevenue[] = []

  for (let i = 0; i < vaults.length; i++) {
    const vault = vaults[i]
    if (!vault) continue

    // Rate limiting: delay before every request except first
    if (i > 0) {
      await delay(config.merklApiDelayMs)
    }

    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        const url = `${config.merklApiBaseUrl}/users/${vault}/rewards?chainId=${config.chainId}`

        // Create AbortController with timeout to prevent indefinite hangs
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.merklApiTimeoutMs)

        let response: Response
        try {
          response = await fetch(url, { signal: controller.signal })
        } finally {
          clearTimeout(timeoutId)
        }

        if (response.status === 429) {
          // Rate limited - exponential backoff and retry
          retryCount++
          if (retryCount >= maxRetries) {
            console.error(`Rate limited for vault ${vault} after ${maxRetries} retries`)
            break
          }
          const backoffMs = config.merklApiDelayMs * 2 ** retryCount * 10
          console.warn(`Rate limited for ${vault}, backing off ${backoffMs}ms`)
          await delay(backoffMs)
          continue
        }

        if (!response.ok) {
          console.warn(`HTTP ${response.status} for vault ${vault}`)
          break
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

        // Apply minimum thresholds
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
        break // Success
      } catch (error) {
        retryCount++
        if (retryCount >= maxRetries) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          console.error(`Failed to fetch revenue for ${vault}: ${errorMessage}`)
        } else {
          await delay(config.merklApiDelayMs * retryCount)
        }
      }
    }
  }

  return results
}

/**
 * Build Merkl claim arrays from VaultRevenue data.
 */
export function buildClaimArrays(vaultRevenue: VaultRevenue[]): {
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
