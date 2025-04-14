import type { Functions } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/postgrest-js'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'

export const useUserPendingJackpotTickets = (): UseQueryResult<
  Functions<'get_pending_jackpot_tickets_purchased'>,
  PostgrestError
> => {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['userPendingJackpotTickets'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pending_jackpot_tickets_purchased')
      if (error) {
        throw new Error(error.message)
      }
      return data
    },
  })
}
