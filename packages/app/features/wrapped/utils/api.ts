import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@my/supabase/database.types'
import type { TopCounterparty, WrappedData } from '../types'

/**
 * Fetches top counterparties from the wrapped_top_counterparties function
 */
export async function fetchTopCounterparties(
  supabase: SupabaseClient<Database>
): Promise<TopCounterparty[]> {
  const { data, error } = await supabase.rpc('wrapped_top_counterparties')

  if (error) {
    throw new Error(`Failed to fetch top counterparties: ${error.message}`)
  }

  return (data || []).map((row) => ({
    name: row.name || '',
    avatarUrl: row.avatar_url || '',
    sendId: row.send_id || 0,
    tagName: row.tag_name || null,
  }))
}

/**
 * Fetches total transfers count from the wrapped_total_transfers function
 */
export async function fetchTotalTransfers(supabase: SupabaseClient<Database>): Promise<number> {
  const { data, error } = await supabase.rpc('wrapped_total_transfers')

  if (error) {
    throw new Error(`Failed to fetch total transfers: ${error.message}`)
  }

  return Number(data?.[0]?.count || 0)
}

/**
 * Fetches unique recipients count from the wrapped_unique_recipients function
 */
export async function fetchUniqueRecipients(supabase: SupabaseClient<Database>): Promise<number> {
  const { data, error } = await supabase.rpc('wrapped_unique_recipients')

  if (error) {
    throw new Error(`Failed to fetch unique recipients: ${error.message}`)
  }

  return Number(data?.[0]?.count || 0)
}

/**
 * Fetches send score rank from the wrapped_send_score_rank function
 */
export async function fetchSendScoreRank(
  supabase: SupabaseClient<Database>
): Promise<number | null> {
  const { data, error } = await supabase.rpc('wrapped_send_score_rank')

  if (error) {
    throw new Error(`Failed to fetch send score rank: ${error.message}`)
  }

  return data?.[0]?.rank ? Number(data[0].rank) : null
}

/**
 * Fetches all wrapped data in parallel
 */
export async function fetchWrappedData(supabase: SupabaseClient<Database>): Promise<WrappedData> {
  const [topCounterparties, totalTransfers, uniqueRecipients, sendScoreRank] = await Promise.all([
    fetchTopCounterparties(supabase),
    fetchTotalTransfers(supabase),
    fetchUniqueRecipients(supabase),
    fetchSendScoreRank(supabase),
  ])

  return {
    topCounterparties,
    totalTransfers,
    uniqueRecipients,
    sendScoreRank,
    fetchedAt: new Date().toISOString(),
  }
}
