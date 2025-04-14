import type { Functions } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/postgrest-js'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'

export const useUserJackpotSummary = (
  limit: number
): UseQueryResult<Functions<'get_user_jackpot_summary'>, PostgrestError> => {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['userJackpotSummary', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_jackpot_summary', { num_runs: limit })
      if (error) {
        // no rows in jackpot table
        if (error.code === 'PGRST116') {
          return []
        }
        throw new Error(error.message)
      }
      return data
    },
  })
}
