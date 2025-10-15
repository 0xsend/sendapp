import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useQuery } from '@tanstack/react-query'

const useDidUserSwapQueryKey = 'did_user_swap'

export const useDidUserSwap = () => {
  const supabase = useSupabase()

  return useQuery({
    queryKey: [useDidUserSwapQueryKey],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('did_user_swap').single()

      if (error) {
        throw new Error(error.message)
      }

      return data as boolean
    },
  })
}

useDidUserSwap.queryKey = useDidUserSwapQueryKey
