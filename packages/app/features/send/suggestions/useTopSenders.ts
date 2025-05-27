import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { UserSchema } from 'app/utils/zod/activity/UserSchema'
import { z } from 'zod'
import type { SendSuggestionsQueryResult } from 'app/features/send/suggestions/SendSuggestion.types'

const QUERY_KEY = 'top_senders'

export const useTopSenders = (): SendSuggestionsQueryResult => {
  const supabase = useSupabase()

  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('top_senders')

      if (error || !data) {
        throw new Error(error?.message || 'Unable to fetch top senders')
      }

      return z.array(UserSchema).parse(data)
    },
    retry: false,
  })
}

useTopSenders.queryKey = QUERY_KEY
