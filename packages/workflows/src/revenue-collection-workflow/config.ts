import { parseUnits } from 'viem'

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
 * Configuration for the revenue collection workflow.
 */
export interface RevenueConfig {
  /** Private key for the EOA that executes harvest + sweep transactions */
  collectorPrivateKey: string | undefined
  /** Minimum MORPHO tokens to harvest (prevents dust harvests) */
  minMorphoHarvest: bigint
  /** Minimum WELL tokens to harvest (prevents dust harvests) */
  minWellHarvest: bigint
  /** Delay in ms between Merkl API requests (respects rate limits) */
  merklApiDelayMs: number
  /** Base URL for Merkl API */
  merklApiBaseUrl: string
  /** Base chain ID */
  chainId: number
}

/**
 * Get revenue configuration from environment variables.
 */
export function getRevenueConfig(env: Record<string, string | undefined>): RevenueConfig {
  return {
    collectorPrivateKey: env.REVENUE_COLLECTOR_PRIVATE_KEY,
    minMorphoHarvest: parseUnits(env.MIN_MORPHO_HARVEST ?? '1', 18), // Default: 1 MORPHO
    minWellHarvest: parseUnits(env.MIN_WELL_HARVEST ?? '10', 18), // Default: 10 WELL
    merklApiDelayMs: Number(env.MERKL_API_DELAY_MS ?? '100'), // 10 req/s max
    merklApiBaseUrl: env.MERKL_API_BASE_URL ?? 'https://api.merkl.xyz/v4',
    chainId: Number(env.CHAIN_ID ?? '8453'), // Base mainnet
  }
}
