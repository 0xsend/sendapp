import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useQuery } from '@tanstack/react-query'
import { pgAddrCondValues } from 'app/utils/pgAddrCondValues'

const useDidUserSwapQueryKey = 'did_user_swap'

export const useDidUserSwap = () => {
  const supabase = useSupabase()
  const { data: swapRouters } = useSwapRouters()
  const { data: liquidityPools } = useLiquidityPools()

  return useQuery({
    queryKey: [useDidUserSwapQueryKey, swapRouters, liquidityPools],
    enabled: Boolean(swapRouters && liquidityPools),
    queryFn: async () => {
      if (!swapRouters || !liquidityPools) {
        return false
      }

      const swapRelatedAddresses = pgAddrCondValues([
        ...swapRouters.map((swapRouter) => swapRouter.router_addr),
        ...liquidityPools.map((liquidityPool) => liquidityPool.pool_addr),
      ])

      const { count, error } = await supabase
        .from('activity_feed')
        .select('*', { count: 'exact', head: true })
        .or('from_user.not.is.null, to_user.not.is.null')
        .or(`data->>f.in.(${swapRelatedAddresses}), data->>t.in.(${swapRelatedAddresses})`)

      if (error) {
        throw new Error(error.message)
      }

      return count !== null && count > 0
    },
  })
}

useDidUserSwap.queryKey = useDidUserSwapQueryKey
