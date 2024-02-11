import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'

export type UserReferralsCount = {
  referralsCount: number | undefined
  error: Error | null
  isLoading: boolean
  refetch: () => void
}
export const useUserReferralsCount = () => {
  const supabase = useSupabase()
  const {
    data: referralsCount,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['user_referrals_count'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('user_referrals_count').select('*')
      if (error) {
        // no rows in receipts table
        if (error.code === 'PGRST116') {
          return []
        }
        throw new Error(error.message)
      }
      return data
    },
  })

  return {
    referralsCount,
    isLoading,
    error,
    refetch,
  } as UserReferralsCount
}
