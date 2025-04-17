import type { Database, Tables } from '@my/supabase/database.types'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { selectAll } from 'app/utils/supabase/selectAll'

/**
 * Creates a Supabase client configured for server-side admin access for the distributor app.
 * This function should be called each time an admin client is needed.
 * It will throw an error if the required environment variables are not set.
 * @returns {SupabaseClient<Database>} A new Supabase client instance.
 * @throws {Error} If NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables are not set.
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE

  // Check for environment variables inside the function
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Please update the environment variables.')
  }
  if (!supabaseServiceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE is not set. Please update the environment variables.')
  }

  // Use the validated environment variables to create the client
  return createClient<Database>(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false }, // Ensure client is stateless for server use
  })
}

function fetchDistributionQuery() {
  const supabaseAdmin = createSupabaseAdminClient()
  return supabaseAdmin.from('distributions').select(
    `
      amount::text,
      bonus_pool_bips,
      chain_id,
      claim_end,
      created_at,
      description,
      fixed_pool_bips,
      hodler_min_balance::text,
      hodler_pool_bips,
      id,
      merkle_drop_addr,
      name,
      number,
      tranche_id,
      qualification_end,
      qualification_start,
      snapshot_block_num,
      token_decimals,
      updated_at,
      distribution_verification_values (
        bips_value,
        created_at,
        distribution_id,
        fixed_value::text,
        multiplier_max,
        multiplier_min,
        multiplier_step,
        type,
        updated_at
      )`,
    { count: 'exact' }
  )
}

export async function fetchActiveDistributions() {
  return fetchDistributionQuery()
    .lte('qualification_start', new Date().toISOString())
    .gte('qualification_end', new Date().toISOString())
}

export async function fetchDistribution(id: string) {
  return fetchDistributionQuery().eq('id', id).single()
}

export async function fetchAllVerifications(distributionId: number, checkpointTime: string) {
  const supabaseAdmin = createSupabaseAdminClient()
  return selectAll(
    supabaseAdmin
      .from('distribution_verifications')
      .select('*', { count: 'exact' })
      .eq('distribution_id', distributionId)
      .lt('created_at', checkpointTime)
  )
}

export async function fetchAllHodlers(distributionId: number) {
  const supabaseAdmin = createSupabaseAdminClient()
  return selectAll(
    supabaseAdmin
      .rpc(
        'distribution_hodler_addresses',
        {
          distribution_id: distributionId,
        },
        { count: 'exact' }
      )
      .select('*')
  )
}

export async function createDistributionShares(
  distributionId: number,
  shares: Tables<'distribution_shares'>[]
) {
  const supabaseAdmin = createSupabaseAdminClient()
  return supabaseAdmin.rpc('update_distribution_shares', {
    distribution_id: distributionId,
    shares,
  })
}

export async function fetchDistributionShares(distributionId: number) {
  const supabaseAdmin = createSupabaseAdminClient()
  return selectAll(
    supabaseAdmin
      .from('distribution_shares')
      .select('user_id, amount::text', { count: 'exact' })
      .eq('distribution_id', distributionId)
  )
}

export async function fetchSendSlash(distribution: {
  id: number
}) {
  const supabaseAdmin = createSupabaseAdminClient()
  return await supabaseAdmin
    .from('send_slash')
    .select('*')
    .eq('distribution_id', distribution.id)
    .single()
}
