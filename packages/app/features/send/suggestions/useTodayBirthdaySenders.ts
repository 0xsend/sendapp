import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { UserSchema } from 'app/utils/zod/activity/UserSchema'
import { z } from 'zod'
import type { SendSuggestionsQueryResult } from 'app/features/send/suggestions/SendSuggestion.types'

const QUERY_KEY = 'today_birthday_senders'

export const useTodayBirthdaySenders = (): SendSuggestionsQueryResult => {
  const supabase = useSupabase()

  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('today_birthday_senders')

      if (error || !data) {
        throw new Error(error?.message || 'Unable to fetch today birthday senders')
      }

      return z.array(UserSchema).parse(data)
    },
    retry: false,
  })
}

useTodayBirthdaySenders.queryKey = QUERY_KEY
