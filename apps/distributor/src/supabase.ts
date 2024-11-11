import type { Database, Tables } from '@my/supabase/database.types'
import { createClient } from '@supabase/supabase-js'
import { selectAll } from 'app/utils/supabase/selectAll'
import type { Address } from 'viem'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is not set. Please update the root .env.local and restart the server.'
  )
}
if (!process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE is not set. Please update the root .env.local and restart the server.'
  )
}

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { persistSession: false } }
)

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

export async function fetchSendSlashData(distributionNumber: number) {
  // Get settings
  const { data: settings } = await supabaseAdmin
    .from('send_slash')
    .select('*')
    .eq('distribution_number', distributionNumber)
    .single()

  // Get verifications
  const { data: verifications } = await supabaseAdmin
    .from('distribution_verifications')
    .select('*')
    .eq('distribution_id', distributionNumber)
    .eq('type', 'send_ceiling')

  return { settings, verifications }
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
