import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useEffect } from 'react'
import { useRouter } from 'solito/router'
import debugBase from 'debug'
import { useQueryClient } from '@tanstack/react-query'

const debug = debugBase('app:utils:useRedirectAfterSignOut')

const useRedirectAfterSignOut = () => {
  const supabase = useSupabase()
  const router = useRouter()
  const queryClient = useQueryClient()
  useEffect(() => {
    const signOutListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        debug('SIGNED_OUT - clearing all caches')
        // Clear all cached queries to prevent stale data between logins
        queryClient.clear()
        router.replace('/')
      }
    })
    return () => {
      signOutListener.data.subscription.unsubscribe()
    }
  }, [supabase, router, queryClient])
}

export const AuthStateChangeHandler = () => {
  useRedirectAfterSignOut()
  return null
}
