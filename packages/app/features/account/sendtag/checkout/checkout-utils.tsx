import { useQuery } from '@tanstack/react-query'
import { useSupabase } from 'app/utils/supabase/useSupabase'

export const verifyAddressMsg = (a: string | `0x${string}`) =>
  `I am the owner of the address: ${a}.

Send.it`
export function useSenderSafeReceivedEvents() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['senderSafeReceivedEvents'],
    queryFn: async () => {
      const { data, error } = await supabase.from('send_revenues_safe_receives').select('*')
      if (error) {
        throw error
      }
      return data
    },
    refetchInterval: 1000 * 5, // 5 seconds
  })
}
