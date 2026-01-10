import { useQuery, useQueryClient } from '@tanstack/react-query'
import debug from 'debug'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { BRIDGE_CUSTOMER_QUERY_KEY } from './useBridgeCustomer'
import type { SourceDepositInstructions } from '@my/bridge'
import { useAnalytics } from 'app/provider/analytics'
import { api } from 'app/utils/api'

const log = debug('app:features:bank-transfer:useBridgeStaticMemo')

const getErrorType = (error: unknown): 'network' | 'unknown' => {
  const message = error instanceof Error ? error.message : String(error)
  if (
    message.includes('Network') ||
    message.includes('network') ||
    message.includes('Failed to fetch')
  ) {
    return 'network'
  }
  return 'unknown'
}

export const BRIDGE_STATIC_MEMO_QUERY_KEY = 'bridge_static_memo' as const

type BankDetails = {
  bankName: string | null
  routingNumber: string | null
  accountNumber: string | null
  beneficiaryName: string | null
  beneficiaryAddress: string | null
  depositMessage: string | null
  paymentRails: string[]
}

function getBankDetailsFromInstructions(
  instructions: SourceDepositInstructions | null | undefined
): BankDetails {
  const paymentRails = instructions?.payment_rails?.length
    ? instructions.payment_rails
    : instructions?.payment_rail
      ? [instructions.payment_rail]
      : []

  return {
    bankName: instructions?.bank_name ?? null,
    routingNumber: instructions?.bank_routing_number ?? null,
    accountNumber: instructions?.bank_account_number ?? null,
    beneficiaryName:
      instructions?.bank_beneficiary_name ?? instructions?.account_holder_name ?? null,
    beneficiaryAddress: instructions?.bank_beneficiary_address ?? null,
    depositMessage: instructions?.deposit_message ?? null,
    paymentRails,
  }
}

/**
 * Hook to fetch the current user's static memo
 */
export function useBridgeStaticMemo() {
  const { user, profile } = useUser()
  const supabase = useSupabase()
  const customerType = profile?.is_business ? 'business' : 'individual'

  return useQuery({
    queryKey: [BRIDGE_STATIC_MEMO_QUERY_KEY, user?.id, customerType],
    enabled: !!user?.id && !!profile,
    queryFn: async () => {
      log('fetching bridge static memo for user', user?.id)

      // Join through bridge_customers to get the static memo
      const { data, error } = await supabase
        .from('bridge_static_memos')
        .select(
          `
          *,
          bridge_customers!inner(user_id)
        `
        )
        .eq('status', 'active')
        .eq('bridge_customers.type', customerType)
        .maybeSingle()

      if (error) {
        log('error fetching bridge static memo', error)
        throw new Error(error.message)
      }

      log('bridge static memo', data)
      return data
    },
    staleTime: 30_000,
  })
}

/**
 * Hook to create a static memo after KYC approval
 */
export function useCreateStaticMemo() {
  const queryClient = useQueryClient()
  const analytics = useAnalytics()

  return api.bridge.createStaticMemo.useMutation({
    onMutate: () => {
      log('creating static memo')
      analytics.capture({
        name: 'bank_transfer_account_setup_started',
        properties: {
          method: 'static_memo',
        },
      })
    },
    onSuccess: () => {
      analytics.capture({
        name: 'bank_transfer_account_setup_completed',
        properties: {
          method: 'static_memo',
        },
      })
      queryClient.invalidateQueries({ queryKey: [BRIDGE_STATIC_MEMO_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [BRIDGE_CUSTOMER_QUERY_KEY] })
    },
    onError: (error) => {
      analytics.capture({
        name: 'bank_transfer_account_setup_failed',
        properties: {
          method: 'static_memo',
          error_type: getErrorType(error),
        },
      })
    },
  })
}

/**
 * Get bank account details for deposits
 */
export function useStaticMemoBankAccountDetails() {
  const { data: memo, isLoading, error } = useBridgeStaticMemo()

  if (isLoading || error || !memo) {
    return {
      isLoading,
      error,
      hasStaticMemo: false,
      bankDetails: null,
    }
  }

  const sourceInstructions = (memo.source_deposit_instructions ??
    null) as SourceDepositInstructions | null

  return {
    isLoading: false,
    error: null,
    hasStaticMemo: true,
    bankDetails: getBankDetailsFromInstructions(sourceInstructions),
  }
}
