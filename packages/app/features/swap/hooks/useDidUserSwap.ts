import { useLiquidityPools } from 'app/utils/useLiquidityPools'
import { useSwapRouters } from 'app/utils/useSwapRouters'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useQuery } from '@tanstack/react-query'
import { pgAddrCondValues } from 'app/utils/pgAddrCondValues'
import { throwIf } from 'app/utils/throwIf'

const useDidUserSwapQueryKey = 'did_user_swap'

export const useDidUserSwap = () => {
  const supabase = useSupabase()
  const swapRouters = useSwapRouters()
  const liquidityPools = useLiquidityPools()

  return useQuery({
    queryKey: [useDidUserSwapQueryKey, { swapRouters, liquidityPools }] as const,
    enabled:
      (swapRouters.isSuccess || swapRouters.isError) &&
      (liquidityPools.isSuccess || liquidityPools.isError),
    queryFn: async ({ queryKey: [, params] }) => {
      const { swapRouters, liquidityPools } = params
      throwIf(swapRouters.error)
      throwIf(liquidityPools.error)
      if (!swapRouters.data || !liquidityPools.data) {
        return false
      }

      const swapRelatedAddresses = pgAddrCondValues([
        ...swapRouters.data.map((swapRouter) => swapRouter.router_addr),
        ...liquidityPools.data.map((liquidityPool) => liquidityPool.pool_addr),
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
