// Re-export shared types from @my/send-earn
export type {
  VaultRevenue,
  VaultBalances,
  HarvestRecord,
  SweepRecord,
  RevenueError,
  MerklTokenReward,
  MerklRewardsResponse,
} from '@my/send-earn'

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
