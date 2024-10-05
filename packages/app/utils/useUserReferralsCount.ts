import type { Functions } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/postgrest-js'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'

export const useUserReferralsCount = (): UseQueryResult<
  Functions<'user_referrals_count'>,
  PostgrestError
> => {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['user_referrals_count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('user_referrals_count').select('*')
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
