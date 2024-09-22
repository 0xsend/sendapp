import type { Tables } from '@my/supabase/database-generated.types'
import type { PostgrestError } from '@supabase/postgrest-js'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'

export const useAffiliateStats = (): UseQueryResult<Tables<'affiliate_stats'>, PostgrestError> => {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['affiliate_stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('affiliate_stats').select('*').single()
      if (error) {
        // no rows in receipts table
        if (error.code === 'PGRST116') {
          return []
        }
        throw new Error(error.message)
      }
      return data
    },
  })
}
