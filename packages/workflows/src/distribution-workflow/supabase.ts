import type { Database, Tables } from '@my/supabase/database.types'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { selectAll } from 'app/utils/supabase/selectAll'

export async function fetchAllOpenDistributions() {
  return selectAll(
    supabaseAdmin
      .from('distributions')
      .select(
        `*,
        distribution_verification_values (*)`,
        {
          count: 'exact',
        }
      )
      .lte('qualification_start', new Date().toISOString())
      .gte('qualification_end', new Date().toISOString())
  )
}

export async function fetchDistribution(id: string) {
  return supabaseAdmin
    .from('distributions')
    .select(
      `*,
        distribution_verification_values (*)`
    )
    .eq('id', id)
    .single()
}

export async function fetchAllVerifications(distributionId: number) {
  return selectAll(
    supabaseAdmin
      .from('distribution_verifications')
      .select('*', { count: 'exact' })
      .eq('distribution_id', distributionId)
  )
}

export async function fetchAllHodlers(distributionId: number) {
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
  return supabaseAdmin.rpc('update_distribution_shares', {
    distribution_id: distributionId,
    shares,
  })
}
