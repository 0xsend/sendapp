import type { Session, SessionContext as SessionContextHelper } from '@supabase/auth-helpers-react'
import { AuthError, type User } from '@supabase/supabase-js'
import { supabase } from 'app/utils/supabase/client.native'
import { router, useSegments } from 'expo-router'
import { createContext, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import type { AuthProviderProps } from './AuthProvider'

export const SessionContext = createContext<SessionContextHelper>({
  session: null,
  error: null,
  isLoading: false,
  supabaseClient: supabase,
})

export const AuthProvider = ({ children, initialSession }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(initialSession || null)
  const [error, setError] = useState<AuthError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  useProtectedRoute(session?.user ?? null)
  useEffect(() => {
    setIsLoading(true)
    supabase.auth
      .getSession()
      .then(({ data: { session: newSession } }) => {
        setSession(newSession)
      })
      .catch((error) => setError(new AuthError(error.message)))
      .finally(() => setIsLoading(false))
  }, [])
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const contextValue = useMemo(() => {
    if (session) {
      return {
        session,
        isLoading: false as const,
        error: null,
        supabaseClient: supabase,
      }
    }

    if (error) {
      return {
        error,
        isLoading: false as const,
        session: null,
        supabaseClient: supabase,
      }
    }

    return {
      error: null,
      isLoading,
      session: null,
      supabaseClient: supabase,
    }
  }, [session, error, isLoading])

  return <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>
}

export function useProtectedRoute(user: User | null) {
  const segments = useSegments()
  const firstSegment = segments[0]
  useEffect(() => {
    if (!firstSegment) return
    if (firstSegment === '_sitemap') return
    if (firstSegment === '+not-found') return

    const inAuthGroup = firstSegment === '(auth)'

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !user &&
      !inAuthGroup
    ) {
      // Redirect to the splash page.
      replaceRoute('/')
      console.log('redirecting to / for auth group', firstSegment)
    }
    // TODO: decide if we need to redirect to onboarding if user has no send account
    // else if (user && inAuthGroup) {
    //   // Redirect away from the sign-in page.
    //   replaceRoute('/')
    //   console.log('redirecting to / away from auth group', firstSegment)
    // }
  }, [user, firstSegment])
}

/**
 * temporary fix
 *
 * see https://github.com/expo/router/issues/740
 * see https://github.com/expo/router/issues/745
 *  */
const replaceRoute = (href: string) => {
  if (Platform.OS === 'ios') {
    setTimeout(() => {
      router.dismissAll()
    }, 1)
  } else {
    setImmediate(() => {
      router.dismissAll()
      router.replace(href)
    })
  }
}
