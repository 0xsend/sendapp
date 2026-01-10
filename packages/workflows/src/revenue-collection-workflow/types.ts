// Re-export shared types from @my/send-earn
export type {
  VaultRevenue,
  VaultBalances,
  HarvestRecord,
  SweepRecord,
  RevenueError,
  MerklRewardsResponse,
} from '@my/send-earn'

/**
 * Static addresses for revenue tokens and contracts on Base chain.
 * Duplicated here to avoid importing runtime code from @my/send-earn
 * which would break Temporal workflow determinism.
 */
export const REVENUE_ADDRESSES = {
  MORPHO_TOKEN: '0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842' as const,
  WELL_TOKEN: '0xA88594D404727625A9437C3f886C7643872296AE' as const,
  MERKL_DISTRIBUTOR: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as const,
  /** Send Foundation revenue safe */
  REVENUE_SAFE: '0x65049C4B8e970F5bcCDAE8E141AA06346833CeC4' as const,
}

/**
 * Result of executing harvest transactions.
 * Workflow-specific: includes transaction hashes as strings for serialization.
 */
export interface HarvestResult {
  /** All transaction hashes (batch) */
  transactions: `0x${string}`[]
  totals: { morpho: bigint; well: bigint }
  /** Each harvest with its tx metadata */
  successful: import('@my/send-earn').HarvestRecord[]
  errors: import('@my/send-earn').RevenueError[]
}

/**
 * Result of executing sweep transactions.
 * Workflow-specific: includes transaction hashes as strings for serialization.
 */
export interface SweepResult {
  /** All transaction hashes */
  transactions: `0x${string}`[]
  totals: { morpho: bigint; well: bigint }
  /** Each sweep with its tx metadata */
  successful: import('@my/send-earn').SweepRecord[]
  errors: import('@my/send-earn').RevenueError[]
}

/**
 * Input for the revenue collection workflow.
 */
export interface RevenueCollectionInput {
  /** Optional: specific vaults to process, or all if empty */
  vaultAddresses?: `0x${string}`[]
  /** If true, only simulate without executing transactions */
  dryRun?: boolean
}

/**
 * Dry run simulation data.
 */
export interface DryRunData {
  harvestableFromMerkl: {
    vault: `0x${string}`
    morphoAmount: bigint
    wellAmount: bigint
  }[]
  currentVaultBalances: {
    vault: `0x${string}`
    morphoBalance: bigint
    wellBalance: bigint
  }[]
  expectedRevenue: {
    morpho: bigint
    well: bigint
  }
}

/**
 * Result of the revenue collection workflow.
 */
export interface RevenueCollectionResult {
  vaultsProcessed: number
  harvested: {
    morpho: bigint
    well: bigint
    transactions: `0x${string}`[]
  }
  swept: {
    morpho: bigint
    well: bigint
    transactions: `0x${string}`[]
  }
  errors: import('@my/send-earn').RevenueError[]
  /** Only present if dryRun=true */
  dryRunData?: DryRunData
}
