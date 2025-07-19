import { useQuery } from '@tanstack/react-query'
import debug from 'debug'
import { useRouter } from 'solito/router'
import { useSessionContext } from './supabase/useSessionContext'
import { useSupabase } from './supabase/useSupabase'

const log = debug('app:utils:useUser')

export const useUser = () => {
  const { session, isLoading: isLoadingSession } = useSessionContext()
  const user = session?.user
  const router = useRouter()
  const supabase = useSupabase()

  // Enhance validation for the token
  const validateToken = async () => {
    try {
      // Test token validity with a lightweight API call
      const { error } = await supabase.auth.getUser()
      if (error) {
        log('invalid token detected', error)
        await supabase.auth.signOut()
        router.replace('/')
        return false
      }
      return true
    } catch (e) {
      log('error validating token', e)
      await supabase.auth.signOut()
      router.replace('/')
      return false
    }
  }

  // Run validation on mount if we have a session
  useQuery({
    queryKey: ['validateToken', user?.id],
    queryFn: validateToken,
    enabled: !!session, // Only run when we have a session
    retry: false,
    staleTime: 60_000, // Cache validation for 1 minute
  })

  const {
    data: profile,
    isLoading: isLoadingProfile,
    refetch,
  } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, tags(*), main_tag(*)')
        .eq('id', user?.id ?? '')
        .single()

      if (error) {
        // no rows - edge case of user being deleted
        if (error.code === 'PGRST116') {
          log('no profile found for user', user?.id)
          await supabase.auth.signOut()
          router.replace('/')
          return null
        }
        // check unauthorized or jwt error
        if (error.code === 'PGRST301' || error.code === 'PGRST401') {
          log('unauthorized or invalid JWT token')
          await supabase.auth.signOut()
          router.replace('/')
          return null
        }
        throw new Error(error.message)
      }
      return data
    },
  })

  const avatarUrl = (() => {
    if (profile?.avatar_url) return profile.avatar_url
    if (typeof user?.user_metadata?.avatar_url === 'string') return user.user_metadata.avatar_url

    const params = new URLSearchParams()
    const name = profile?.name || user?.email || ''
    params.append('name', name)
    params.append('size', '256') // will be resized again by NextImage/SolitoImage
    return `https://ui-avatars.com/api?${params.toString()}&format=png&background=86ad7f`
  })()

  return {
    session,
    user,
    profile,
    avatarUrl,
    tags: profile?.tags,
    mainTag: profile?.main_tag,
    updateProfile: refetch,
    isLoadingSession,
    isLoadingProfile,
    isLoading: isLoadingSession || isLoadingProfile,
    validateToken,
  }
}

export type UseUserReturn = ReturnType<typeof useUser>
