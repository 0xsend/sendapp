import { useQuery } from '@tanstack/react-query'
import debug from 'debug'
import { useSessionContext } from './supabase/useSessionContext'
import { useSupabase } from './supabase/useSupabase'

const log = debug('app:utils:useUser')

export const useUser = () => {
  const { session, isLoading: isLoadingSession } = useSessionContext()
  const user = session?.user

  const supabase = useSupabase()
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
        .select('*')
        .eq('id', user?.id ?? '')
        .single()
      if (error) {
        // no rows - edge case of user being deleted
        if (error.code === 'PGRST116') {
          log('no profile found for user', user?.id)
          await supabase.auth.signOut()
          return null
        }
        // check unauthorized or jwt error
        if (error.code === 'PGRST301') {
          log('unauthorized')
          await supabase.auth.signOut()
        }
        throw new Error(error.message)
      }
      return data
    },
  })

  const {
    data: tags,
    isLoading: isLoadingTags,
    refetch: refetchTags,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*')

      if (error) {
        // no rows
        if (error.code === 'PGRST116') {
          return []
        }
        log('error fetching tags', error)
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
    return `https://ui-avatars.com/api.jpg?${params.toString()}`
  })()

  return {
    session,
    user,
    profile,
    avatarUrl,
    tags,
    updateProfile: () =>
      refetch().then(() => {
        refetchTags()
      }),
    isLoadingSession,
    isLoadingProfile,
    isLoadingTags,
    isLoading: isLoadingSession || isLoadingProfile || isLoadingTags,
  }
}
