import { type UseQueryResult, useQuery } from '@tanstack/react-query'
import { useSupabase } from '../supabase/useSupabase'
import { useUser } from '../useUser'
import type { Tables } from '@my/supabase/database.types'

export type SendAccountQuery = Tables<'send_accounts'> & {
  send_account_credentials: Tables<'send_account_credentials'>[]
  webauthn_credentials: Tables<'webauthn_credentials'>[]
}
export function useSendAccounts(): UseQueryResult<SendAccountQuery[], Error> {
  const { user } = useUser()
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['send_accounts'],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('send_accounts')
        .select('*, send_account_credentials(*), webauthn_credentials(*)')

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
