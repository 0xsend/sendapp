import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useEffect } from 'react'
import { useRouter } from 'solito/router'
import debugBase from 'debug'

const debug = debugBase('app:utils:useRedirectAfterSignOut')

const useRedirectAfterSignOut = () => {
  const supabase = useSupabase()
  const router = useRouter()
  useEffect(() => {
    const signOutListener = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        debug('SIGNED_OUT')
        router.replace('/')
      }
    })
    return () => {
      signOutListener.data.subscription.unsubscribe()
    }
  }, [supabase, router])
}

export const AuthStateChangeHandler = () => {
  useRedirectAfterSignOut()
  return null
}
