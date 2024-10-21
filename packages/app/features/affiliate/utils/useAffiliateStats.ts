import type { PostgrestError } from '@supabase/postgrest-js'
import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { api } from 'app/utils/api'

export const useAffiliateStats = (): UseQueryResult<
  {
    created_at: string
    id: string
    paymaster_tx_count: number
    updated_at: string
    user_id: string | null
    referredPaymasterTxCount: number
    referralsCount: number
  },
  PostgrestError
> => {
  return useQuery({
    queryKey: ['affiliate_stats'],
    queryFn: async () => {
      const { data, error } = await api.affiliate.getStats.useQuery()
      console.log('error: ', error)
      console.log('data: ', data)
      if (error) {
        throw new Error(error.message)
      }
      return data
    },
  })
}
