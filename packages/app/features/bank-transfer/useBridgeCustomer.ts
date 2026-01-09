import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import debug from 'debug'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import getBaseUrl from 'app/utils/getBaseUrl'

const log = debug('app:features:bank-transfer:useBridgeCustomer')

export const BRIDGE_CUSTOMER_QUERY_KEY = 'bridge_customer' as const

function extractCustomerRejectionReasons(input: unknown): string[] {
  if (!Array.isArray(input)) return []

  const reasons: string[] = []
  for (const item of input) {
    if (typeof item === 'string') {
      reasons.push(item)
      continue
    }

    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>
      const reason = typeof record.reason === 'string' ? record.reason : null
      if (reason) reasons.push(reason)

      const subReasons = Array.isArray(record.sub_reasons)
        ? record.sub_reasons.filter((value) => typeof value === 'string')
        : []
      reasons.push(...(subReasons as string[]))
    }
  }

  return Array.from(new Set(reasons))
}

/**
 * Helper to create auth headers for API requests (supports native clients)
 */
async function getAuthHeaders(
  supabase: ReturnType<typeof useSupabase>
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    headers.Authorization = `Bearer ${data.session.access_token}`
  }

  return headers
}

/**
 * Hook to fetch the current user's Bridge customer record
 */
export function useBridgeCustomer() {
  const { user } = useUser()
  const supabase = useSupabase()

  return useQuery({
    queryKey: [BRIDGE_CUSTOMER_QUERY_KEY, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      log('fetching bridge customer for user', user?.id)

      const { data, error } = await supabase.from('bridge_customers_safe').select('*').maybeSingle()

      if (error) {
        log('error fetching bridge customer', error)
        throw new Error(error.message)
      }

      log('bridge customer', data)
      return data
    },
    staleTime: 5_000,
    refetchInterval: 5_000,
  })
}

/**
 * Hook to initiate KYC flow by calling the API
 */
export function useInitiateKyc() {
  const queryClient = useQueryClient()
  const supabase = useSupabase()

  return useMutation({
    mutationFn: async (data?: { redirectUri?: string }) => {
      log('initiating KYC', data)

      const headers = await getAuthHeaders(supabase)
      const response = await fetch(`${getBaseUrl()}/api/bridge/kyc-link`, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to initiate KYC')
      }

      return response.json() as Promise<{ kycLink: string; tosLink: string }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRIDGE_CUSTOMER_QUERY_KEY] })
    },
  })
}

/**
 * Check if user has completed KYC
 */
export function useKycStatus() {
  const { data: customer, isLoading, error, refetch } = useBridgeCustomer()
  const rejectionReasons = extractCustomerRejectionReasons(customer?.rejection_reasons)

  return {
    isLoading,
    error,
    kycStatus: customer?.kyc_status ?? 'not_started',
    tosStatus: customer?.tos_status ?? 'pending',
    isTosAccepted: customer?.tos_status === 'approved',
    isApproved: customer?.kyc_status === 'approved',
    isRejected: customer?.kyc_status === 'rejected',
    isPending:
      customer?.kyc_status === 'under_review' ||
      customer?.kyc_status === 'incomplete' ||
      customer?.kyc_status === 'awaiting_questionnaire' ||
      customer?.kyc_status === 'awaiting_ubo',
    customer,
    rejectionReasons,
    refetch,
  }
}
