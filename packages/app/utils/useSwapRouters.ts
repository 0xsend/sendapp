import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useQuery } from '@tanstack/react-query'
import { SwapRouterArraySchema } from 'app/utils/zod/SwapRouterSchema'

const useSwapRoutersQueryKey = 'swap_routers'

export const useSwapRouters = () => {
  const supabase = useSupabase()

  return useQuery({
    queryKey: [useSwapRoutersQueryKey],
    staleTime: 30_000,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.from('swap_routers').select('*')

      if (error) {
        throw new Error(error.message)
      }

      return SwapRouterArraySchema.parse(data)
    },
  })
}

useSwapRouters.queryKey = useSwapRoutersQueryKey
