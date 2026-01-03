import { proxyActivities } from '@temporalio/workflow'
import type { RewardsClaimActivities } from './activities'
import type { RewardsClaimWorkflowInput, RewardsClaimWorkflowResult } from './types'

/**
 * Read-only activities can be retried safely.
 */
const readActivities = proxyActivities<
  Pick<RewardsClaimActivities, 'getActiveVaultsActivity' | 'fetchClaimableRewardsActivity'>
>({
  startToCloseTimeout: '5 minutes',
  retry: {
    maximumAttempts: 3,
    initialInterval: '10 seconds',
    backoffCoefficient: 2,
  },
})

/**
 * Non-idempotent activities: no automatic retries to prevent duplicate transactions.
 */
const writeActivities = proxyActivities<
  Pick<RewardsClaimActivities, 'executeClaimActivity' | 'recordClaimsActivity'>
>({
  startToCloseTimeout: '10 minutes',
  retry: {
    maximumAttempts: 1, // No retries - claims are non-idempotent
  },
})

/**
 * Workflow to claim rewards from Merkl for Send Earn vaults.
 *
 * Steps:
 * 1. Get list of active vaults
 * 2. Fetch claimable rewards from Merkl API
 * 3. Filter vaults with rewards above thresholds
 * 4. Execute claim transactions (batch with individual fallback)
 * 5. Record successful claims in database
 */
export async function RewardsClaimWorkflow(
  input: RewardsClaimWorkflowInput = {}
): Promise<RewardsClaimWorkflowResult> {
  // 1. Get list of vaults to process
  const vaults = input.vaultAddresses ?? (await readActivities.getActiveVaultsActivity())

  if (vaults.length === 0) {
    return {
      vaultsProcessed: 0,
      totalClaimed: { morpho: 0n, well: 0n },
      transactions: [],
      errors: [],
    }
  }

  // 2. Fetch claimable rewards from Merkl API for all vaults
  const rewardsData = await readActivities.fetchClaimableRewardsActivity({ vaults })

  // 3. Filter vaults with rewards above configured thresholds
  // hasClaimableRewards is set by fetchClaimableRewardsActivity based on min thresholds
  const claimableVaults = rewardsData.filter((r) => r.hasClaimableRewards)

  if (claimableVaults.length === 0) {
    return {
      vaultsProcessed: vaults.length,
      totalClaimed: { morpho: 0n, well: 0n },
      transactions: [],
      errors: [],
    }
  }

  // Dry run mode - return totals without claiming
  if (input.dryRun) {
    return {
      vaultsProcessed: vaults.length,
      totalClaimed: {
        morpho: claimableVaults.reduce((sum, v) => sum + v.morphoAmount, 0n),
        well: claimableVaults.reduce((sum, v) => sum + v.wellAmount, 0n),
      },
      transactions: [],
      errors: [],
    }
  }

  // 4. Execute claim transactions with fallback to individual claims on failure
  const claimResult = await writeActivities.executeClaimActivity({
    claims: claimableVaults,
  })

  // 5. Record successful claims in database (each claim has its own tx metadata)
  if (claimResult.successful.length > 0) {
    await writeActivities.recordClaimsActivity({
      claims: claimResult.successful,
    })
  }

  return {
    vaultsProcessed: vaults.length,
    totalClaimed: claimResult.totals,
    transactions: claimResult.transactions,
    errors: claimResult.errors,
  }
}
