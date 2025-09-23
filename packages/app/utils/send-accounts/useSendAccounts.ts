import { queryOptions, useQuery } from '@tanstack/react-query'
import debug from 'debug'
import { useRouter } from 'solito/router'
import { useSupabase } from '../supabase/useSupabase'
import { useUser } from '../useUser'

const log = debug('app:utils:send-accounts')

/**
 * @deprecated use useSendAccount instead
 */
export function useSendAccounts() {
  const { user, validateToken } = useUser()
  const supabase = useSupabase()
  const router = useRouter()

  return useQuery({
    queryKey: ['send_accounts'],
    enabled: !!user?.id,
    queryFn: async () => {
      // Validate token before proceeding
      const isTokenValid = await validateToken()
      if (!isTokenValid) {
        return []
      }

      const { data, error } = await supabase
        .from('send_accounts')
        .select('*, send_account_credentials(*, webauthn_credentials(*))')

      if (error) {
        // no rows
        if (error.code === 'PGRST116') {
          return []
        }
        // Handle authorization errors
        if (error.code === 'PGRST301' || error.code === 'PGRST401') {
          log('unauthorized or invalid token in useSendAccounts')
          await supabase.auth.signOut()
          router.replace('/')
          return []
        }
        throw new Error(error.message)
      }
      return data
    },
  })
}

const useSendAccountQueryKey = 'send_account'

export function sendAccountQueryOptions({
  user,
  supabase,
  validateToken,
  router,
}: {
  user: ReturnType<typeof useUser>['user']
  supabase: ReturnType<typeof useSupabase>
  validateToken: () => Promise<boolean>
  router: ReturnType<typeof useRouter>
}) {
  return queryOptions({
    queryKey: [useSendAccountQueryKey],
    enabled: !!user?.id,
    queryFn: async () => {
      // Validate token before proceeding
      const isTokenValid = await validateToken()
      if (!isTokenValid) {
        return null
      }

      // Use maybeSingle to avoid 406 (PGRST116) when no rows exist yet during onboarding
      const { data, error } = await supabase
        .from('send_accounts')
        .select('*, send_account_credentials(*, webauthn_credentials(*))')
        .maybeSingle()

      if (error) {
        // No rows case is handled by maybeSingle() returning data=null without error,
        // but keep this guard for defensive compatibility.
        if (error.code === 'PGRST116') {
          return null
        }
        // Handle authorization errors
        if (error.code === 'PGRST301' || error.code === 'PGRST401') {
          log('unauthorized or invalid token in sendAccountQueryOptions')
          await supabase.auth.signOut()
          router.replace('/')
          return null
        }
        throw new Error(error.message)
      }
      return data
    },
    staleTime: 30_000,
  })
}

export function useSendAccount() {
  const { user, validateToken } = useUser()
  const supabase = useSupabase()
  const router = useRouter()

  return useQuery(sendAccountQueryOptions({ user, supabase, validateToken, router }))
}

useSendAccount.queryKey = useSendAccountQueryKey
