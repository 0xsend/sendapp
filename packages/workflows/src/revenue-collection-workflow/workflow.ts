import { proxyActivities } from '@temporalio/workflow'
import type { RevenueCollectionActivities } from './activities'
import { REVENUE_ADDRESSES } from './config'
import type {
  DryRunData,
  RevenueCollectionInput,
  RevenueCollectionResult,
  VaultBalances,
  VaultRevenue,
} from './types'

/**
 * Read-only activities can be retried safely.
 */
const readActivities = proxyActivities<
  Pick<
    RevenueCollectionActivities,
    'getActiveVaultsActivity' | 'fetchHarvestableRevenueActivity' | 'getVaultBalancesActivity'
  >
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
  Pick<
    RevenueCollectionActivities,
    | 'harvestRevenueActivity'
    | 'sweepToRevenueActivity'
    | 'recordHarvestActivity'
    | 'recordSweepActivity'
  >
>({
  startToCloseTimeout: '10 minutes',
  retry: {
    maximumAttempts: 1, // No retries - transactions are non-idempotent
  },
})

/**
 * Build dry run data from harvestable revenue and current vault balances.
 */
function buildDryRunData(harvestable: VaultRevenue[], balances: VaultBalances[]): DryRunData {
  const harvestableFromMerkl = harvestable.map((v) => ({
    vault: v.vault,
    morphoAmount: v.morphoAmount,
    wellAmount: v.wellAmount,
  }))

  const currentVaultBalances = balances.map((b) => ({
    vault: b.vault,
    morphoBalance: b.morphoBalance,
    wellBalance: b.wellBalance,
  }))

  const sumHarvestable = harvestable.reduce(
    (acc, v) => ({
      morpho: acc.morpho + v.morphoAmount,
      well: acc.well + v.wellAmount,
    }),
    { morpho: 0n, well: 0n }
  )

  const sumBalances = balances.reduce(
    (acc, b) => ({
      morpho: acc.morpho + b.morphoBalance,
      well: acc.well + b.wellBalance,
    }),
    { morpho: 0n, well: 0n }
  )

  return {
    harvestableFromMerkl,
    currentVaultBalances,
    expectedRevenue: {
      morpho: sumHarvestable.morpho + sumBalances.morpho,
      well: sumHarvestable.well + sumBalances.well,
    },
  }
}

/**
 * Workflow to collect revenue from Send Earn vaults.
 *
 * Two-step process:
 * 1. Harvest: Transfer from Merkl to vault addresses (Merkl.claim)
 * 2. Sweep: Transfer from vaults to revenue safe (SendEarn.collect)
 *
 * Steps:
 * 1. Get list of active vaults
 * 2. Fetch harvestable revenue from Merkl API
 * 3. (Dry run only) Get current vault balances for simulation
 * 4. If dry run, return DryRunData without executing
 * 5. Execute harvest transactions (batch with individual fallback)
 * 6. Record successful harvests in database
 * 7. Execute sweep transactions (reads fresh balances internally)
 * 8. Record successful sweeps in database
 */
export async function RevenueCollectionWorkflow(
  input: RevenueCollectionInput = {}
): Promise<RevenueCollectionResult> {
  // 1. Get list of vaults to process
  const vaults = input.vaultAddresses ?? (await readActivities.getActiveVaultsActivity())

  if (vaults.length === 0) {
    return {
      vaultsProcessed: 0,
      harvested: { morpho: 0n, well: 0n, transactions: [] },
      swept: { morpho: 0n, well: 0n, transactions: [] },
      errors: [],
    }
  }

  // 2. Fetch harvestable revenue from Merkl API for all vaults
  const harvestable = await readActivities.fetchHarvestableRevenueActivity({ vaults })

  // 3. For dry run, get current vault balances for simulation
  if (input.dryRun) {
    const balances = await readActivities.getVaultBalancesActivity({ vaults })
    const dryRunData = buildDryRunData(harvestable, balances)

    return {
      vaultsProcessed: vaults.length,
      harvested: { morpho: 0n, well: 0n, transactions: [] },
      swept: { morpho: 0n, well: 0n, transactions: [] },
      errors: [],
      dryRunData,
    }
  }

  // 4. Filter vaults with harvestable revenue above thresholds
  const harvestableVaults = harvestable.filter((r) => r.hasHarvestableRevenue)

  // 5. Execute harvest transactions (Merkl.claim)
  const harvestResult = await writeActivities.harvestRevenueActivity({
    vaultRevenue: harvestableVaults,
  })

  // 6. Record successful harvests in database
  if (harvestResult.successful.length > 0) {
    await writeActivities.recordHarvestActivity({
      records: harvestResult.successful,
    })
  }

  // 7. Execute sweep transactions (SendEarn.collect)
  // CRITICAL: sweepToRevenueActivity reads FRESH balances internally after harvest
  // This ensures newly harvested tokens + any existing balances are swept
  const sweepResult = await writeActivities.sweepToRevenueActivity({
    vaults,
    tokens: [
      REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
      REVENUE_ADDRESSES.WELL_TOKEN as `0x${string}`,
    ],
  })

  // 8. Record successful sweeps in database
  if (sweepResult.successful.length > 0) {
    await writeActivities.recordSweepActivity({
      records: sweepResult.successful,
    })
  }

  return {
    vaultsProcessed: vaults.length,
    harvested: {
      morpho: harvestResult.totals.morpho,
      well: harvestResult.totals.well,
      transactions: harvestResult.transactions,
    },
    swept: {
      morpho: sweepResult.totals.morpho,
      well: sweepResult.totals.well,
      transactions: sweepResult.transactions,
    },
    errors: [...harvestResult.errors, ...sweepResult.errors],
  }
}
