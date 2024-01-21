import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSupabase } from './supabase/useSupabase'
import type { Tables } from '@my/supabase/database.types'
import type { PostgrestError } from '@supabase/supabase-js'
import { assert } from './assert'

export function useProfileLookup(
  tag?: string
): UseQueryResult<Tables<'profiles'> & { tags: Tables<'tags'> }, PostgrestError> {
  const supabase = useSupabase()
  return useQuery(
    ['profile', tag],
    async () => {
      assert(!!tag, 'tag is required')
      const { data, error } = await supabase
        .from('profiles')
        .select('*, tags(*)')
        .eq('tags.name', tag)
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
