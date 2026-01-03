/**
 * Rewards data for a single vault from Merkl API.
 */
export interface VaultRewards {
  vault: `0x${string}`
  morphoAmount: bigint
  wellAmount: bigint
  morphoProof: `0x${string}`[]
  wellProof: `0x${string}`[]
  /** True only if amounts exceed configured thresholds */
  hasClaimableRewards: boolean
}

/**
 * Each claim record includes full transaction metadata for accurate DB insertion.
 */
export interface ClaimRecord {
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
 * Result of executing claim transactions.
 */
export interface ClaimResult {
  /** All transaction hashes (batch or individual fallbacks) */
  transactions: `0x${string}`[]
  totals: { morpho: bigint; well: bigint }
  /** Each claim with its tx metadata */
  successful: ClaimRecord[]
  errors: { vault: string; error: string }[]
}

/**
 * Input for the rewards claim workflow.
 */
export interface RewardsClaimWorkflowInput {
  /** Optional: specific vaults to process, or all if empty */
  vaultAddresses?: `0x${string}`[]
  /** If true, only check rewards without claiming */
  dryRun?: boolean
}

/**
 * Result of the rewards claim workflow.
 */
export interface RewardsClaimWorkflowResult {
  vaultsProcessed: number
  totalClaimed: {
    morpho: bigint
    well: bigint
  }
  transactions: `0x${string}`[]
  errors: { vault: string; error: string }[]
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
