/**
 * Static addresses for revenue tokens and contracts on Base chain.
 */
export const REVENUE_ADDRESSES = {
  MORPHO_TOKEN: '0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842' as const,
  WELL_TOKEN: '0xA88594D404727625A9437C3f886C7643872296AE' as const,
  MERKL_DISTRIBUTOR: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as const,
  /** Send Foundation revenue safe */
  REVENUE_SAFE: '0x65049C4B8e970F5bcCDAE8E141AA06346833CeC4' as const,
}

/**
 * Configuration for the revenue collection operations.
 */
export interface RevenueConfig {
  /** PostgreSQL connection string */
  dbUrl: string
  /** Base chain RPC endpoint */
  rpcUrl: string
  /** Private key for the EOA that executes harvest + sweep transactions */
  collectorPrivateKey?: string
  /** Minimum MORPHO tokens to harvest (prevents dust harvests) */
  minMorphoHarvest: bigint
  /** Minimum WELL tokens to harvest (prevents dust harvests) */
  minWellHarvest: bigint
  /** Delay in ms between Merkl API requests (respects rate limits) */
  merklApiDelayMs: number
  /** Timeout in ms for Merkl API requests (prevents indefinite hangs) */
  merklApiTimeoutMs: number
  /** Base URL for Merkl API */
  merklApiBaseUrl: string
  /** Base chain ID */
  chainId: number
  /** Optional: specific vaults to process */
  vaultFilter?: `0x${string}`[]
}

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
 * Transaction record for completed operations.
 */
export interface TransactionRecord {
  vault: `0x${string}`
  token: `0x${string}`
  amount: bigint
  txHash: `0x${string}`
  blockNum: bigint
  blockTime: bigint
}

/**
 * Harvest record for DB insertion (Merkl → vault).
 */
export interface HarvestRecord extends TransactionRecord {}

/**
 * Sweep record for DB insertion (vault → revenue safe).
 */
export interface SweepRecord extends TransactionRecord {
  /** Revenue safe destination address */
  destination: `0x${string}`
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
 * Vault that was skipped during sweep.
 */
export interface SkippedVault {
  vault: `0x${string}`
  reason: string
}

/**
 * Result of dry run operation.
 */
export interface DryRunResult {
  vaults: VaultRevenue[]
  balances: VaultBalances[]
  totals: {
    harvestable: { morpho: bigint; well: bigint }
    vaultBalances: { morpho: bigint; well: bigint }
    sweepable: { morpho: bigint; well: bigint }
  }
}

/**
 * Result of executing harvest transactions.
 */
export interface HarvestResult {
  harvested: { morpho: bigint; well: bigint }
  transactions: TransactionRecord[]
  errors: RevenueError[]
}

/**
 * Result of executing sweep transactions.
 */
export interface SweepResult {
  swept: { morpho: bigint; well: bigint }
  transactions: TransactionRecord[]
  skipped: SkippedVault[]
  errors: RevenueError[]
}

/**
 * Merkl API v4 token info structure.
 */
export interface MerklTokenInfo {
  address: string
  chainId: number
  symbol: string
  decimals: number
  price?: number
}

/**
 * Merkl API v4 reward structure for a single token.
 */
export interface MerklV4Reward {
  /** Merkle root for claiming */
  root: string
  /** Chain ID where rewards can be claimed */
  distributionChainId: number
  /** User address receiving the reward */
  recipient: string
  /** Total tokens credited onchain */
  amount: string
  /** Already-claimed tokens */
  claimed: string
  /** Rewards updating ~every 2 hours (not immediately claimable) */
  pending: string
  /** Merkle proofs for claiming */
  proofs: string[]
  /** Token info */
  token: MerklTokenInfo
  /** Campaign attribution */
  breakdowns: {
    root: string
    distributionChainId: number
    reason: string
    amount: string
    claimed: string
    pending: string
    campaignId: string
    subCampaignId?: string
  }[]
}

/**
 * Merkl API v4 response structure (array of chain data with rewards).
 */
export type MerklRewardsResponse = {
  chain: {
    id: number
    name: string
    [key: string]: unknown
  }
  rewards: MerklV4Reward[]
}[]

/**
 * Output format options.
 */
export type OutputFormat = 'table' | 'json' | 'csv' | 'markdown'
