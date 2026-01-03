import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { log } from '@temporalio/activity'
import type { ClaimRecord } from './types'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type for reward claims table row
interface RewardClaimRow {
  vault: string
  token: string
  amount: string
  tx_hash: string
  block_num: number
  block_time: number
}

/**
 * Insert reward claim records into the database.
 * Note: Uses type assertion since send_earn_reward_claims may not be in generated types yet.
 * Once migration is run and types regenerated, this can be simplified.
 */
export async function insertRewardClaims(claims: ClaimRecord[]): Promise<void> {
  if (claims.length === 0) {
    log.info('No claims to insert')
    return
  }

  const supabaseAdmin = createSupabaseAdminClient()

  // Convert claims to database format
  // Use bytea escape format for PostgreSQL
  const rows: RewardClaimRow[] = claims.map((claim) => ({
    vault: `\\x${claim.vault.slice(2)}`,
    token: `\\x${claim.token.slice(2)}`,
    amount: claim.amount.toString(),
    tx_hash: `\\x${claim.txHash.slice(2)}`,
    block_num: Number(claim.blockNum),
    block_time: Number(claim.blockTime),
  }))

  // Use from with type assertion since table may not be in generated types yet
  // biome-ignore lint/suspicious/noExplicitAny: table not in generated types until migration runs
  const { error } = await (supabaseAdmin as SupabaseClient<any>)
    .from('send_earn_reward_claims')
    .insert(rows)

  if (error) {
    log.error('Failed to insert reward claims', { error, claimCount: claims.length })
    throw error
  }

  log.info('Successfully inserted reward claims', { claimCount: claims.length })
}

/**
 * Get active vault addresses from the database.
 */
export async function getActiveVaults(): Promise<`0x${string}`[]> {
  const supabaseAdmin = createSupabaseAdminClient()

  const { data, error } = await supabaseAdmin
    .from('send_earn_create')
    .select('send_earn')
    .order('block_num', { ascending: false })

  if (error) {
    log.error('Failed to fetch active vaults', { error })
    throw error
  }

  if (!data || data.length === 0) {
    log.info('No active vaults found')
    return []
  }

  // Convert bytea to hex and deduplicate
  const vaults = [
    ...new Set(
      data.map((d) => {
        const hex = d.send_earn as unknown as string
        // Handle both bytea (\\x...) and Buffer formats
        if (typeof hex === 'string' && hex.startsWith('\\x')) {
          return `0x${hex.slice(2)}` as `0x${string}`
        }
        if (Buffer.isBuffer(hex)) {
          return `0x${hex.toString('hex')}` as `0x${string}`
        }
        return hex as `0x${string}`
      })
    ),
  ]

  log.info('Fetched active vaults', { count: vaults.length })
  return vaults
}
