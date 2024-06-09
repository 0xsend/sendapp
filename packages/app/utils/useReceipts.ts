import { useQuery } from '@tanstack/react-query'
import { useSupabase } from './supabase/useSupabase'
import type { Tables } from '@my/supabase/database.types'

export type Receipts = {
  receipts: Tables<'receipts'>[]
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
