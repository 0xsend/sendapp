/**
 * Revenue data for a single vault from Merkl API.
 */
export interface VaultRevenue {
  vault: `0x${string}`
  morphoAmount: bigint
  wellAmount: bigint
  morphoProof: `0x${string}`[]
  wellProof: `0x${string}`[]
  /** True only if amounts exceed configured thresholds */
  hasHarvestableRevenue: boolean
}

/**
 * Token balances for a vault.
 */
export interface VaultBalances {
  vault: `0x${string}`
  morphoBalance: bigint
  wellBalance: bigint
}

/**
 * Harvest record for DB insertion (Merkl → vault).
 */
export interface HarvestRecord {
  vault: `0x${string}`
  /** MORPHO or WELL token address */
  token: `0x${string}`
  amount: bigint
  txHash: `0x${string}`
  blockNum: bigint
  /** Chain timestamp from block, not Date.now() */
  blockTime: bigint
}

/**
 * Sweep record for DB insertion (vault → revenue safe).
 */
export interface SweepRecord {
  vault: `0x${string}`
  /** MORPHO or WELL token address */
  token: `0x${string}`
  amount: bigint
  /** Revenue safe destination address */
  destination: `0x${string}`
  txHash: `0x${string}`
  blockNum: bigint
  /** Chain timestamp from block, not Date.now() */
  blockTime: bigint
}

/**
 * Error type with step discriminator for aggregation.
 */
export interface RevenueError {
  vault: string
  /** Discriminates error source */
  step: 'harvest' | 'sweep'
  error: string
}

/**
 * Result of executing harvest transactions.
 */
export interface HarvestResult {
  /** All transaction hashes (batch or individual fallbacks) */
  transactions: `0x${string}`[]
  totals: { morpho: bigint; well: bigint }
  /** Each harvest with its tx metadata */
  successful: HarvestRecord[]
  errors: RevenueError[]
}

/**
 * Result of executing sweep transactions.
 */
export interface SweepResult {
  /** All transaction hashes */
  transactions: `0x${string}`[]
  totals: { morpho: bigint; well: bigint }
  /** Each sweep with its tx metadata */
  successful: SweepRecord[]
  errors: RevenueError[]
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
  errors: RevenueError[]
  /** Only present if dryRun=true */
  dryRunData?: DryRunData
}

/**
 * Merkl API reward response structure for a single token.
 */
export interface MerklTokenReward {
  /** Total tokens credited onchain */
  amount: string
  /** Already-claimed tokens */
  claimed: string
  /** Rewards updating ~every 2 hours (not immediately claimable) */
  pending: string
  /** Merkle proofs for claiming */
  proofs: string[]
  /** Campaign attribution */
  breakdowns: {
    campaignId: string
    amount: string
  }[]
}

/**
 * Merkl API response structure.
 */
export type MerklRewardsResponse = Record<string, MerklTokenReward>
