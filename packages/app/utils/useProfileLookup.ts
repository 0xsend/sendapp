import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSupabase } from './supabase/useSupabase'
import type { Functions, Database } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/supabase-js'
import { assert } from './assert'

export function useProfileLookup(
  id_type: Database['public']['Enums']['id_type_enum'],
  identifier: string
): UseQueryResult<Functions<'profile_lookup'>[number], PostgrestError> {
  assert(!!id_type, 'id_type is required')
  assert(!!identifier, 'identifier is required')

  const supabase = useSupabase()
  return useQuery({
    queryKey: ['profile', id_type, identifier],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('profile_lookup', { id_type, identifier })
        .maybeSingle()
      if (error) {
        throw error
      }
      return data
    },
    enabled: !!id_type && !!identifier,
  })
}
