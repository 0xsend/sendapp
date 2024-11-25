import type { Functions } from '@my/supabase/database.types'
import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'

export function useAffiliateStats() {
  const supabase = useSupabase()
  async function fetchAffiliateStats(): Promise<
    Functions<'get_affiliate_stats_summary'>[number] | null
  > {
    const request = supabase.rpc('get_affiliate_stats_summary').select('*').single()

    const { data, error } = await request
    if (error) {
      // no rows in receipts table
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(error.message)
    }

    return data
  }

  return useQuery({
    queryKey: ['affiliate_stats_summary'],
    queryFn: fetchAffiliateStats,
  })
}
