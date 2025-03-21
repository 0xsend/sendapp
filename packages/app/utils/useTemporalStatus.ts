import { useQuery, type UseQueryOptions } from '@tanstack/react-query'
import { useSupabase } from './supabase/useSupabase'
import type { Database } from '@my/supabase/database-generated.types'

type TemporalTables = Database['temporal']['Tables']
type TableNames = keyof TemporalTables

export type TemporalStatus = {
  [Table in TableNames]: TemporalTables[Table]['Row']['status']
}

export const TEMPORAL_STATUS_INTERVAL = 1000

export function useTemporalStatus({
  workflowId,
  table,
  ...options
}: { workflowId: string | null; table: TableNames } & Omit<
  UseQueryOptions,
  'queryKey' | 'queryFn'
>) {
  const supabase = useSupabase()

  return useQuery({
    ...options,
    queryKey: ['workflowStatus', workflowId, table],
    queryFn: async () => {
      if (!workflowId) return null

      const { data, error } = await supabase
        .schema('temporal')
        .from(table)
        .select('status')
        .eq('workflow_id', workflowId)
        .single()

      if (error) throw error

      return data.status
    },
  })
}
