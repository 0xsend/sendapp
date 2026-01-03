import { parseUnits } from 'viem'

/**
 * Static addresses for reward tokens and distributor on Base chain.
 */
export const REWARDS_ADDRESSES = {
  MORPHO_TOKEN: '0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842' as const,
  WELL_TOKEN: '0xA88594D404727625A9437C3f886C7643872296AE' as const,
  MERKL_DISTRIBUTOR: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as const,
}

/**
 * Configuration for the rewards claiming workflow.
 */
export interface RewardsConfig {
  /** Private key for the EOA claimer */
  claimerPrivateKey: string | undefined
  /** Minimum MORPHO tokens to claim (prevents dust claims) */
  minMorphoClaim: bigint
  /** Minimum WELL tokens to claim (prevents dust claims) */
  minWellClaim: bigint
  /** Delay in ms between Merkl API requests (respects rate limits) */
  merklApiDelayMs: number
  /** Base URL for Merkl API */
  merklApiBaseUrl: string
  /** Base chain ID */
  chainId: number
}

/**
 * Get rewards configuration from environment variables.
 */
export function getRewardsConfig(env: Record<string, string | undefined>): RewardsConfig {
  return {
    claimerPrivateKey: env.REWARDS_CLAIMER_PRIVATE_KEY,
    minMorphoClaim: parseUnits(env.MIN_MORPHO_CLAIM ?? '1', 18), // Default: 1 MORPHO
    minWellClaim: parseUnits(env.MIN_WELL_CLAIM ?? '10', 18), // Default: 10 WELL
    merklApiDelayMs: Number(env.MERKL_API_DELAY_MS ?? '100'), // 10 req/s max
    merklApiBaseUrl: env.MERKL_API_BASE_URL ?? 'https://api.merkl.xyz/v4',
    chainId: Number(env.CHAIN_ID ?? '8453'), // Base mainnet
  }
}
