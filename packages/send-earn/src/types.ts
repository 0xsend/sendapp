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
  /** Fee share data for affiliate contracts and direct recipients */
  feeShares: FeeDistributionDryRunResult
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

/**
 * Fee recipient type discriminator.
 * - affiliate: SendEarnAffiliate contract that can be automated via pay()
 * - direct: Revenue Safe receives shares directly (manual redemption)
 */
export type FeeRecipientType = 'affiliate' | 'direct'

/**
 * Information about a vault's fee recipient configuration.
 */
export interface FeeRecipientInfo {
  vault: `0x${string}`
  feeRecipient: `0x${string}`
  type: FeeRecipientType
  /** Vault shares held by the fee recipient (redeemable for USDC) */
  redeemableShares: bigint
  /** Only present for affiliate type */
  affiliateDetails?: AffiliateDetails
}

/**
 * Details for affiliate-type fee recipients.
 */
export interface AffiliateDetails {
  /** Address that receives 25% split */
  affiliate: `0x${string}`
  /** Vault where platform's 75% is deposited */
  platformVault: `0x${string}`
  /** Vault where affiliate's 25% is deposited */
  payVault: `0x${string}`
  /** Platform address that owns platformVault shares */
  platform: `0x${string}`
}

/**
 * Result of fee distribution operation.
 */
export interface FeeDistributionResult {
  distributed: {
    /** Total vault shares redeemed across all transactions */
    totalShares: bigint
    /** Number of vaults successfully processed */
    vaultCount: number
  }
  transactions: FeeDistributionRecord[]
  skipped: SkippedFeeRecipient[]
  errors: FeeDistributionError[]
}

/**
 * Record of a single fee distribution transaction.
 *
 * Note: SendEarnAffiliate.pay() redeems vault shares for assets (USDC),
 * then splits assets 75/25 and deposits into platformVault and payVault.
 * We track input shares; actual asset amounts depend on vault exchange rate
 * at execution time and can be derived from transaction events if needed.
 */
export interface FeeDistributionRecord {
  vault: `0x${string}`
  affiliateContract: `0x${string}`
  /** Vault shares that were redeemed (input to pay()) */
  sharesRedeemed: bigint
  txHash: `0x${string}`
  blockNum: bigint
  blockTime: bigint
}

/**
 * Fee recipient skipped during distribution.
 */
export interface SkippedFeeRecipient {
  vault: `0x${string}`
  feeRecipient: `0x${string}`
  reason: string
}

/**
 * Error during fee distribution.
 */
export interface FeeDistributionError {
  vault: `0x${string}`
  affiliateContract: `0x${string}`
  error: string
}

/**
 * Dry run result for fee distribution.
 */
export interface FeeDistributionDryRunResult {
  affiliates: FeeRecipientInfo[]
  directRecipients: FeeRecipientInfo[]
  totals: {
    /** Total shares held by affiliate contracts (automatable) */
    affiliateShares: bigint
    /** Total shares held directly by Revenue Safe (manual) */
    directShares: bigint
  }
}

/**
 * Underlying vault type for TVL display.
 */
export type UnderlyingVaultType = 'Morpho' | 'Moonwell' | 'Unknown'

/**
 * TVL data for a single vault.
 */
export interface VaultTVL {
  vault: `0x${string}`
  /** Total USDC deposited (6 decimals) */
  totalAssets: bigint
  /** Total vault shares */
  totalSupply: bigint
  /** Underlying Morpho or Moonwell vault address */
  underlyingVault: `0x${string}`
  /** Underlying vault type (Morpho, Moonwell, or Unknown) */
  vaultType: UnderlyingVaultType
}

/**
 * Result of TVL query.
 */
export interface TVLResult {
  vaults: VaultTVL[]
  totals: {
    /** Total USDC across all vaults (6 decimals) */
    totalAssets: bigint
    /** Number of active vaults */
    vaultCount: number
  }
}
