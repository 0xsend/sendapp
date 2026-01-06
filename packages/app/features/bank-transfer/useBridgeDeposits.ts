import { useQuery } from '@tanstack/react-query'
import debug from 'debug'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'

const log = debug('app:features:bank-transfer:useBridgeDeposits')

export const BRIDGE_DEPOSITS_QUERY_KEY = 'bridge_deposits' as const

/**
 * Hook to fetch the current user's deposits
 */
export function useBridgeDeposits(options?: { limit?: number }) {
  const { user } = useUser()
  const supabase = useSupabase()
  const limit = options?.limit ?? 50

  return useQuery({
    queryKey: [BRIDGE_DEPOSITS_QUERY_KEY, user?.id, { limit }],
    enabled: !!user?.id,
    queryFn: async () => {
      log('fetching bridge deposits for user', user?.id)

      const { data, error } = await supabase
        .from('bridge_deposits')
        .select(
          `
          *,
          bridge_virtual_accounts!inner(
            bridge_customers!inner(user_id)
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        log('error fetching bridge deposits', error)
        throw new Error(error.message)
      }

      log('bridge deposits', data?.length)
      return data
    },
    staleTime: 15_000, // Shorter stale time for deposits
    refetchInterval: 30_000, // Poll every 30s for new deposits
  })
}

/**
 * Hook to fetch a specific deposit by ID
 */
export function useBridgeDeposit(depositId: string | undefined) {
  const { user } = useUser()
  const supabase = useSupabase()

  return useQuery({
    queryKey: [BRIDGE_DEPOSITS_QUERY_KEY, depositId],
    enabled: !!user?.id && !!depositId,
    queryFn: async () => {
      if (!depositId) return null

      log('fetching bridge deposit', depositId)

      const { data, error } = await supabase
        .from('bridge_deposits')
        .select(
          `
          *,
          bridge_virtual_accounts!inner(
            bridge_customers!inner(user_id)
          )
        `
        )
        .eq('id', depositId)
        .single()

      if (error) {
        log('error fetching bridge deposit', error)
        throw new Error(error.message)
      }

      log('bridge deposit', data)
      return data
    },
  })
}

/**
 * Summarize deposit status for display
 */
export function useDepositsSummary() {
  const { data: deposits, isLoading, error } = useBridgeDeposits()

  if (isLoading || error || !deposits) {
    return {
      isLoading,
      error,
      pendingCount: 0,
      completedCount: 0,
      totalDeposited: 0,
    }
  }

  const pendingCount = deposits.filter(
    (d) =>
      d.status === 'funds_received' ||
      d.status === 'funds_scheduled' ||
      d.status === 'in_review' ||
      d.status === 'payment_submitted'
  ).length

  const completedCount = deposits.filter((d) => d.status === 'payment_processed').length

  const totalDeposited = deposits
    .filter((d) => d.status === 'payment_processed')
    .reduce((sum, d) => sum + Number(d.net_amount ?? d.amount), 0)

  return {
    isLoading: false,
    error: null,
    pendingCount,
    completedCount,
    totalDeposited,
    deposits,
  }
}
