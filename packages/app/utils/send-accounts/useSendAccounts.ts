import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '../supabase/useSupabase'
import { useUser } from '../useUser'

/**
 * @deprecated use useSendAccount instead
 */
export function useSendAccounts() {
  const { user } = useUser()
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['send_accounts'],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('send_accounts')
        .select('*, send_account_credentials(*, webauthn_credentials(*))')

      if (error) {
        // no rows
        if (error.code === 'PGRST116') {
          return []
        }
        throw new Error(error.message)
      }
      return data
    },
  })
}

const useSendAccountQueryKey = 'send_account'

export function useSendAccount() {
  const { user } = useUser()
  const supabase = useSupabase()

  return useQuery({
    queryKey: [useSendAccountQueryKey],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('send_accounts')
        .select('*, send_account_credentials(*, webauthn_credentials(*))')
        .single()

      if (error) {
        // no rows
        if (error.code === 'PGRST116') {
          return null
        }
        throw new Error(error.message)
      }
      return data
    },
  })
}

useSendAccount.queryKey = useSendAccountQueryKey
