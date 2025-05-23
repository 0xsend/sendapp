import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { UserSchema } from 'app/utils/zod/activity/UserSchema'
import { z } from 'zod'

export type UseFavouriteSendersItem = z.infer<typeof UserSchema>
export type UseFavouriteSendersResult = UseQueryResult<UseFavouriteSendersItem[]>
const QUERY_KEY = 'favourite_senders'

export const useFavouriteSenders = (): UseFavouriteSendersResult => {
  const supabase = useSupabase()

  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('favourite_senders')

      if (error || !data) {
        throw new Error(error?.message || 'Unable to fetch favourite senders')
      }

      return z.array(UserSchema).parse(data)
    },
    retry: false,
  })
}

useFavouriteSenders.queryKey = QUERY_KEY
