import { useQuery, useQueryClient } from '@tanstack/react-query'
import debug from 'debug'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { BRIDGE_CUSTOMER_QUERY_KEY } from './useBridgeCustomer'
import type { SourceDepositInstructions } from '@my/bridge'
import { useAnalytics } from 'app/provider/analytics'
import { api } from 'app/utils/api'

const log = debug('app:features:bank-transfer:useBridgeVirtualAccount')

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

export const BRIDGE_VIRTUAL_ACCOUNT_QUERY_KEY = 'bridge_virtual_account' as const

type BankDetails = {
  bankName: string | null
  routingNumber: string | null
  accountNumber: string | null
  beneficiaryName: string | null
  beneficiaryAddress: string | null
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
    beneficiaryName: instructions?.bank_beneficiary_name ?? null,
    beneficiaryAddress: instructions?.bank_beneficiary_address ?? null,
    paymentRails,
  }
}

/**
 * Hook to fetch the current user's virtual account
 */
export function useBridgeVirtualAccount() {
  const { user, profile } = useUser()
  const supabase = useSupabase()
  const customerType = profile?.is_business ? 'business' : 'individual'

  return useQuery({
    queryKey: [BRIDGE_VIRTUAL_ACCOUNT_QUERY_KEY, user?.id, customerType],
    enabled: !!user?.id && !!profile,
    queryFn: async () => {
      log('fetching bridge virtual account for user', user?.id)

      // Join through bridge_customers to get the virtual account
      const { data, error } = await supabase
        .from('bridge_virtual_accounts')
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
        log('error fetching bridge virtual account', error)
        throw new Error(error.message)
      }

      log('bridge virtual account', data)
      return data
    },
    staleTime: 30_000,
  })
}

/**
 * Hook to create a virtual account after KYC approval
 */
export function useCreateVirtualAccount() {
  const queryClient = useQueryClient()
  const analytics = useAnalytics()

  return api.bridge.createVirtualAccount.useMutation({
    onMutate: () => {
      log('creating virtual account')
      analytics.capture({
        name: 'bank_transfer_account_setup_started',
        properties: {
          method: 'virtual_account',
        },
      })
    },
    onSuccess: () => {
      analytics.capture({
        name: 'bank_transfer_account_setup_completed',
        properties: {
          method: 'virtual_account',
        },
      })
      queryClient.invalidateQueries({ queryKey: [BRIDGE_VIRTUAL_ACCOUNT_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [BRIDGE_CUSTOMER_QUERY_KEY] })
    },
    onError: (error) => {
      analytics.capture({
        name: 'bank_transfer_account_setup_failed',
        properties: {
          method: 'virtual_account',
          error_type: getErrorType(error),
        },
      })
    },
  })
}

/**
 * Get bank account details for deposits
 */
export function useBankAccountDetails() {
  const { data: virtualAccount, isLoading, error } = useBridgeVirtualAccount()

  if (isLoading || error || !virtualAccount) {
    return {
      isLoading,
      error,
      hasVirtualAccount: false,
      bankDetails: null,
    }
  }

  const sourceInstructions = (virtualAccount.source_deposit_instructions ??
    null) as SourceDepositInstructions | null

  return {
    isLoading: false,
    error: null,
    hasVirtualAccount: true,
    bankDetails: getBankDetailsFromInstructions(sourceInstructions),
  }
}
