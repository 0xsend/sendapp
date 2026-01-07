import { type RevenueConfig, createConfig, REVENUE_ADDRESSES } from '@my/send-earn'
import { base } from 'viem/chains'

// Re-export from @my/send-earn for convenience
export { REVENUE_ADDRESSES }
export type { RevenueConfig }

/**
 * Get revenue configuration from environment variables.
 * Maps workflow env vars to @my/send-earn config format.
 */
export function getRevenueConfig(env: Record<string, string | undefined>): RevenueConfig {
  const dbUrl = env.SUPABASE_DB_URL
  if (!dbUrl) {
    throw new Error('SUPABASE_DB_URL environment variable is required')
  }

  const rpcUrl = env.BASE_RPC_URL ?? base.rpcUrls.default.http[0]
  if (!rpcUrl) {
    throw new Error('BASE_RPC_URL environment variable is required')
  }

  return createConfig({
    dbUrl,
    rpcUrl,
    collectorPrivateKey: env.REVENUE_COLLECTOR_PRIVATE_KEY,
    minMorphoHarvest: env.MIN_MORPHO_HARVEST
      ? BigInt(env.MIN_MORPHO_HARVEST) * 10n ** 18n
      : undefined,
    minWellHarvest: env.MIN_WELL_HARVEST ? BigInt(env.MIN_WELL_HARVEST) * 10n ** 18n : undefined,
    merklApiDelayMs: env.MERKL_API_DELAY_MS ? Number(env.MERKL_API_DELAY_MS) : undefined,
    merklApiTimeoutMs: env.MERKL_API_TIMEOUT_MS ? Number(env.MERKL_API_TIMEOUT_MS) : undefined,
    merklApiBaseUrl: env.MERKL_API_BASE_URL,
    chainId: env.CHAIN_ID ? Number(env.CHAIN_ID) : undefined,
  })
}
