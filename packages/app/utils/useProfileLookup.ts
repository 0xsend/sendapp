import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSupabase } from './supabase/useSupabase'
import type { Functions, Database } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/supabase-js'
import { assert } from './assert'

export function useProfileLookup(
  lookup_type: Database['public']['Enums']['lookup_type_enum'],
  identifier: string
): UseQueryResult<Functions<'profile_lookup'>[number], PostgrestError> {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['profile', lookup_type, identifier],
    queryFn: async () => {
      assert(!!lookup_type, 'lookup_type is required')
      assert(!!identifier, 'identifier is required')
      const { data, error } = await supabase
        .rpc('profile_lookup', { lookup_type: lookup_type, identifier: identifier })
        .maybeSingle()
      if (error) {
        throw error
      }
      return data
    },
    enabled: !!lookup_type && !!identifier,
  })
}
