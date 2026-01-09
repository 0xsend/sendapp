import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import debug from 'debug'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { api } from 'app/utils/api'

const log = debug('app:features:bank-transfer:useBridgeCustomer')

export const MAX_KYC_REJECTION_ATTEMPTS = 3

export const BRIDGE_CUSTOMER_QUERY_KEY = 'bridge_customer' as const
export const KYC_PROFILE_TYPE_LOCK_STATUSES = new Set([
  'approved',
  'rejected',
  'paused',
  'offboarded',
])

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
 * Hook to fetch the current user's Bridge customer record
 */
export function useBridgeCustomer() {
  const { user, profile, isLoadingProfile } = useUser()
  const supabase = useSupabase()
  const customerType = profile?.is_business ? 'business' : 'individual'

  const query = useQuery({
    queryKey: [BRIDGE_CUSTOMER_QUERY_KEY, user?.id, customerType],
    enabled: !!user?.id && !isLoadingProfile,
    queryFn: async () => {
      log('fetching bridge customer for user', user?.id)

      const { data, error } = await supabase
        .from('bridge_customers_safe')
        .select('*')
        .eq('type', customerType)
        .maybeSingle()

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

  return {
    ...query,
    isLoading: query.isLoading || isLoadingProfile,
  }
}

/**
 * Hook to check if profile type changes are blocked by completed KYC
 */
export function useBridgeCustomerKycLock() {
  const { user } = useUser()
  const supabase = useSupabase()

  const query = useQuery({
    queryKey: [BRIDGE_CUSTOMER_QUERY_KEY, user?.id, 'kyc_lock'],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('bridge_customers_safe').select('kyc_status')

      if (error) {
        log('error fetching bridge customer kyc status', error)
        throw new Error(error.message)
      }

      return (
        data?.some((row) =>
          row?.kyc_status ? KYC_PROFILE_TYPE_LOCK_STATUSES.has(row.kyc_status) : false
        ) ?? false
      )
    },
    staleTime: 5_000,
    refetchInterval: 5_000,
  })

  return {
    ...query,
    isLocked: query.data ?? false,
  }
}

/**
 * Hook to initiate KYC flow by calling the API
 */
export function useInitiateKyc() {
  const queryClient = useQueryClient()

  return api.bridge.createKycLink.useMutation({
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
  const rejectionAttempts = customer?.rejection_attempts ?? 0
  const isMaxAttemptsExceeded = rejectionAttempts >= MAX_KYC_REJECTION_ATTEMPTS

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
    rejectionAttempts,
    isMaxAttemptsExceeded,
    refetch,
  }
}

/**
 * Determines if KYC polling should stop based on status and attempts.
 * Stops when: approved OR (rejected AND max attempts reached)
 */
function shouldStopPolling(kycStatus: string, rejectionAttempts: number): boolean {
  if (kycStatus === 'approved') return true
  if (kycStatus === 'rejected' && rejectionAttempts >= MAX_KYC_REJECTION_ATTEMPTS) return true
  return false
}

/**
 * Hook to poll Bridge API directly for KYC status.
 * More responsive than waiting for webhooks.
 *
 * Polling stops when:
 * - KYC is approved
 * - KYC is rejected AND max rejection attempts (3) reached
 *
 * @param kycLinkId - The KYC link ID to poll. Polling is disabled when undefined.
 * @param options.enabled - Additional condition to enable polling (default: true)
 * @param options.interval - Polling interval in ms (default: 2000)
 */
export function usePollKycStatus(
  kycLinkId: string | undefined,
  options?: { enabled?: boolean; interval?: number }
) {
  const { enabled = true, interval = 2_000 } = options ?? {}
  const queryClient = useQueryClient()
  const { user, profile } = useUser()
  const customerType = profile?.is_business ? 'business' : 'individual'

  const query = api.bridge.getKycStatus.useQuery(
    { kycLinkId: kycLinkId ?? '' },
    {
      enabled: !!kycLinkId && enabled,
      refetchInterval: (query) => {
        const data = query.state.data
        if (!data) return interval

        // Stop polling if terminal state reached
        if (shouldStopPolling(data.kycStatus, data.rejectionAttempts)) {
          log('stopping KYC poll: status=%s attempts=%d', data.kycStatus, data.rejectionAttempts)
          return false
        }

        return interval
      },
      staleTime: 0, // Always fetch fresh data
    }
  )

  const data = query.data

  // Invalidate bridge customer query when KYC status data changes
  useEffect(() => {
    if (data) {
      queryClient.invalidateQueries({
        queryKey: [BRIDGE_CUSTOMER_QUERY_KEY, user?.id, customerType],
      })
    }
  }, [data, queryClient, user?.id, customerType])

  const rejectionReasons = extractCustomerRejectionReasons(data?.rejectionReasons)

  return {
    ...query,
    kycStatus: data?.kycStatus ?? 'not_started',
    tosStatus: data?.tosStatus ?? 'pending',
    rejectionReasons,
    rejectionAttempts: data?.rejectionAttempts ?? 0,
    isApproved: data?.kycStatus === 'approved',
    isRejected: data?.kycStatus === 'rejected',
    isMaxAttemptsExceeded: (data?.rejectionAttempts ?? 0) >= MAX_KYC_REJECTION_ATTEMPTS,
    shouldStopPolling: data ? shouldStopPolling(data.kycStatus, data.rejectionAttempts) : false,
  }
}
