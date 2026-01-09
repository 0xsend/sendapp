import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import debug from 'debug'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { BRIDGE_CUSTOMER_QUERY_KEY } from './useBridgeCustomer'
import getBaseUrl from 'app/utils/getBaseUrl'
import type { SourceDepositInstructions } from '@my/bridge'

const log = debug('app:features:bank-transfer:useBridgeTransferTemplate')

export const BRIDGE_TRANSFER_TEMPLATE_QUERY_KEY = 'bridge_transfer_template' as const

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
 * Hook to fetch the current user's transfer template
 */
export function useBridgeTransferTemplate() {
  const { user } = useUser()
  const supabase = useSupabase()

  return useQuery({
    queryKey: [BRIDGE_TRANSFER_TEMPLATE_QUERY_KEY, user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      log('fetching bridge transfer template for user', user?.id)

      // Join through bridge_customers to get the transfer template
      const { data, error } = await supabase
        .from('bridge_transfer_templates')
        .select(
          `
          *,
          bridge_customers!inner(user_id)
        `
        )
        .eq('status', 'active')
        .maybeSingle()

      if (error) {
        log('error fetching bridge transfer template', error)
        throw new Error(error.message)
      }

      log('bridge transfer template', data)
      return data
    },
    staleTime: 30_000,
  })
}

/**
 * Hook to create a static transfer template after KYC approval
 */
export function useCreateTransferTemplate() {
  const queryClient = useQueryClient()
  const supabase = useSupabase()

  return useMutation({
    mutationFn: async () => {
      log('creating transfer template')

      const headers = await getAuthHeaders(supabase)
      const response = await fetch(`${getBaseUrl()}/api/bridge/transfer-template/create`, {
        method: 'POST',
        headers,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Failed to create transfer template')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRIDGE_TRANSFER_TEMPLATE_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [BRIDGE_CUSTOMER_QUERY_KEY] })
    },
  })
}

/**
 * Get bank account details for deposits
 */
export function useTransferTemplateBankAccountDetails() {
  const { data: template, isLoading, error } = useBridgeTransferTemplate()

  if (isLoading || error || !template) {
    return {
      isLoading,
      error,
      hasTransferTemplate: false,
      bankDetails: null,
    }
  }

  const sourceInstructions = (template.source_deposit_instructions ??
    null) as SourceDepositInstructions | null

  return {
    isLoading: false,
    error: null,
    hasTransferTemplate: true,
    bankDetails: getBankDetailsFromInstructions(sourceInstructions),
  }
}
