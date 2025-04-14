import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useQuery } from '@tanstack/react-query'
import { selectAll } from 'app/utils/supabase/selectAll'
import { LiquidityPoolArraySchema } from 'app/utils/zod/LiquidityPoolSchema'

const useLiquidityPoolsQueryKey = 'liquidity_pools'

export const useLiquidityPools = () => {
  const supabase = useSupabase()

  return useQuery({
    queryKey: [useLiquidityPoolsQueryKey],
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await selectAll(
        supabase.from('liquidity_pools').select('*', {
          count: 'exact',
        })
      )

      if (error) {
        // no rows
        if (error.code === 'PGRST116') {
          return []
        }

        throw new Error(error.message)
      }

      return LiquidityPoolArraySchema.parse(data)
    },
  })
}

useLiquidityPools.queryKey = useLiquidityPoolsQueryKey
