import { PostgrestError } from '@supabase/supabase-js'
import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSupabase } from './supabase/useSupabase'
import { useUser } from '@supabase/auth-helpers-react'
import { Tables } from '@my/supabase/database.types'

type UseDistributionBonusPoolShares = Pick<
  Tables<'distribution_shares'>,
  'distribution_id' | 'bonus_pool_amount' | 'address' | 'created_at'
>

export type UseDistributionBonusPoolSharesData = (UseDistributionBonusPoolShares & {
  created_at: Date
})[]

export const useDistributionBonusPoolShares = (): UseQueryResult<
  UseDistributionBonusPoolSharesData,
  PostgrestError
> => {
  const supabase = useSupabase()
  const user = useUser()

  return useQuery(['distribution_bonus_pool_shares'], {
    queryFn: async () => {
      if (!user?.id) return
      const { data, error } = await supabase
        .from('distribution_shares')
        .select('distribution_id, bonus_pool_amount, address, created_at')
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      return data.map((bonusPoolShares) => ({
        ...bonusPoolShares,
        created_at: new Date(bonusPoolShares.created_at),
      }))
    },
  })
}
