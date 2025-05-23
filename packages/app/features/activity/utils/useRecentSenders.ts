import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { UserSchema } from 'app/utils/zod/activity/UserSchema'
import { z } from 'zod'

export type UseRecentSendersItem = z.infer<typeof UserSchema>
export type UseRecentSendersResult = UseQueryResult<UseRecentSendersItem[]>
const QUERY_KEY = 'recent_senders'

export const useRecentSenders = (): UseRecentSendersResult => {
  const supabase = useSupabase()

  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('recent_senders')

      if (error || !data) {
        throw new Error(error?.message || 'Unable to fetch recent senders')
      }

      return z.array(UserSchema).parse(data)
    },
    retry: false,
  })
}

useRecentSenders.queryKey = QUERY_KEY
