import type { Tables } from '@my/supabase/database.types'
import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSupabase } from './supabase/useSupabase'
import { useUser } from './useUser'
export function useChainAddresses(): UseQueryResult<Tables<'chain_addresses'>[], Error> {
  const { user } = useUser()
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['chain_addresses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('chain_addresses').select('*')

      if (error) {
        // no rows
        if (error.code === 'PGRST116') {
          return []
        }
        throw new Error(error.message)
      }
      return data
    },
    enabled: !!user?.id,
  })
}
