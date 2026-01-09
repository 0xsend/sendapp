// Types
export type {
  RevenueConfig,
  VaultRevenue,
  VaultBalances,
  TransactionRecord,
  HarvestRecord,
  SweepRecord,
  RevenueError,
  SkippedVault,
  DryRunResult,
  HarvestResult,
  SweepResult,
  MerklTokenInfo,
  MerklV4Reward,
  MerklRewardsResponse,
  OutputFormat,
  // Fee distribution types
  FeeRecipientType,
  FeeRecipientInfo,
  AffiliateDetails,
  FeeDistributionResult,
  FeeDistributionRecord,
  SkippedFeeRecipient,
  FeeDistributionError,
  FeeDistributionDryRunResult,
  // TVL types
  VaultTVL,
  TVLResult,
} from './types'

export { REVENUE_ADDRESSES } from './types'

// Configuration
export { createConfig, DEFAULT_CONFIG } from './revenue'

// High-level functions
export { dryRun, harvest, sweep, distributeFees, feesDryRun, tvl } from './revenue'

// Database
export { getActiveVaults } from './db'

// Lower-level functions for advanced use
export { fetchHarvestableRevenue, buildClaimArrays } from './merkl'
export {
  getVaultBalances,
  executeHarvest,
  executeSweep,
  getFeeRecipientInfo,
  getFeeDistributionDryRun,
  executeFeeDistribution,
  getVaultsTVL,
} from './vaults'

// Output formatting
export {
  formatOutput,
  formatTable,
  formatJson,
  formatCsv,
  formatMarkdown,
} from './output'
