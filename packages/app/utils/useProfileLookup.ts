import { type UseQueryResult, queryOptions, useQuery } from '@tanstack/react-query'
import { useSupabase } from './supabase/useSupabase'
import type { Functions, Database } from '@my/supabase/database.types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assert } from './assert'

export function fetchProfile({
  supabase,
  lookup_type,
  identifier,
}: {
  supabase: SupabaseClient<Database>
  lookup_type: Database['public']['Enums']['lookup_type_enum']
  identifier: string
}) {
  return supabase.rpc('profile_lookup', { lookup_type: lookup_type, identifier: identifier })
}

export function profileLookupQueryOptions({
  supabase,
  lookup_type,
  identifier,
}: {
  supabase: SupabaseClient<Database>
  lookup_type: Database['public']['Enums']['lookup_type_enum'] | undefined
  identifier: string | undefined
}) {
  return queryOptions({
    queryKey: ['profile', { lookup_type, identifier, supabase }] as const,
    queryFn: async ({ queryKey: [, { supabase, lookup_type, identifier }] }) => {
      assert(!!lookup_type, 'lookup_type is required')
      assert(!!identifier, 'identifier is required')
      const { data, error } = await fetchProfile({
        supabase,
        lookup_type,
        identifier,
      }).maybeSingle()
      if (error) {
        if (error.code === 'PGRST116') {
          // no rows found
          return null
        }
        throw error
      }
      return data
    },
    enabled: !!lookup_type && !!identifier,
  })
}

export function useProfileLookup(
  lookup_type: Database['public']['Enums']['lookup_type_enum'],
  identifier: string
): UseQueryResult<Functions<'profile_lookup'>[number] | null, Error> {
  const supabase = useSupabase()
  return useQuery(profileLookupQueryOptions({ supabase, lookup_type, identifier }))
}
