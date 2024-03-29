import { useQuery } from '@tanstack/react-query'
import { useSupabase } from './supabase/useSupabase'

export type Receipts = {
  receipts:
    | {
        created_at: string | null
        hash: string
        user_id: string
      }[]
    | undefined
  error: Error | null
  isLoading: boolean
  refetch: () => void
}
export const useReceipts = () => {
  const supabase = useSupabase()
  const {
    data: receipts,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('receipts').select('*')
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
    receipts,
    isLoading,
    error,
    refetch,
  } as Receipts
}
