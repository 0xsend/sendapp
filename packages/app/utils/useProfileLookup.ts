import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSupabase } from './supabase/useSupabase'
import type { Functions } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/supabase-js'
import { assert } from './assert'

export function useProfileLookup(
  tag?: string
): UseQueryResult<Functions<'profile_lookup'>[number], PostgrestError> {
  const supabase = useSupabase()
  return useQuery(
    ['profile', tag],
    async () => {
      assert(!!tag, 'tag is required')
      const { data, error } = await supabase.rpc('profile_lookup', { tag }).maybeSingle()
      if (error) {
        throw error
      }
      return data
    },
    {
      enabled: !!tag,
    }
  )
}
