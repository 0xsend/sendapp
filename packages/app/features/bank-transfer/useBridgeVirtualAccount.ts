import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import debug from 'debug'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUser } from 'app/utils/useUser'
import { BRIDGE_CUSTOMER_QUERY_KEY } from './useBridgeCustomer'
import getBaseUrl from 'app/utils/getBaseUrl'

const log = debug('app:features:bank-transfer:useBridgeVirtualAccount')

export const BRIDGE_VIRTUAL_ACCOUNT_QUERY_KEY = 'bridge_virtual_account' as const

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
 * Hook to fetch the current user's virtual account
 */
export function useBridgeVirtualAccount() {
  const { user } = useUser()
  const supabase = useSupabase()

  return useQuery({
    queryKey: [BRIDGE_VIRTUAL_ACCOUNT_QUERY_KEY],
    enabled: !!user?.id,
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
  const supabase = useSupabase()

  return useMutation({
    mutationFn: async (destinationAddress: string) => {
      log('creating virtual account for address', destinationAddress)

      const headers = await getAuthHeaders(supabase)
      const response = await fetch(`${getBaseUrl()}/api/bridge/virtual-account/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ destinationAddress }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create virtual account')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BRIDGE_VIRTUAL_ACCOUNT_QUERY_KEY] })
      queryClient.invalidateQueries({ queryKey: [BRIDGE_CUSTOMER_QUERY_KEY] })
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

  return {
    isLoading: false,
    error: null,
    hasVirtualAccount: true,
    bankDetails: {
      bankName: virtualAccount.bank_name,
      routingNumber: virtualAccount.bank_routing_number,
      accountNumber: virtualAccount.bank_account_number,
      beneficiaryName: virtualAccount.bank_beneficiary_name,
      beneficiaryAddress: virtualAccount.bank_beneficiary_address,
      paymentRails: virtualAccount.payment_rails,
    },
  }
}
