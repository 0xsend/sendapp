import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'

const QUERY_KEY = 'friends'

export function useFriends(limit: number) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: [QUERY_KEY, limit] as const,
    queryFn: async () => {
      const { data, count, error } = await supabase
        .rpc('get_friends', undefined, { count: 'exact' })
        .select('*')
        .limit(limit)

      if (error) throw error

      return {
        friends: data || [],
        count: count || 0,
      }
    },
  })
}

useFriends.queryKey = QUERY_KEY
