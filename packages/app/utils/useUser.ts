import { useQuery } from '@tanstack/react-query'
import { useSessionContext } from './supabase/useSessionContext'
import { useSupabase } from './supabase/useSupabase'

export const useUser = () => {
  const { session, isLoading: isLoadingSession } = useSessionContext()
  const user = session?.user
  const supabase = useSupabase()
  const {
    data: profile,
    isLoading: isLoadingProfile,
    refetch,
  } = useQuery(['profile'], {
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (error) {
        // no rows - edge case of user being deleted
        if (error.code === 'PGRST116') {
          await supabase.auth.signOut()
          return null
        }
        // check unauthorized or jwt error
        if (error.code === 'PGRST301') {
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
  } = useQuery(['tags'], {
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase.from('tags').select('*')

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

  const avatarUrl = (function () {
    if (profile?.avatar_url) return profile.avatar_url
    if (typeof user?.user_metadata.avatar_url === 'string') return user.user_metadata.avatar_url

    const params = new URLSearchParams()
    const name = profile?.name || user?.email || ''
    params.append('name', name)
    params.append('size', '256') // will be resized again by NextImage/SolitoImage
    return `https://ui-avatars.com/api.jpg?${params.toString()}`
  })()

  const {
    data: referrals,
    isLoading: isLoadingReferrals,
    refetch: refetchReferrals,
  } = useQuery(['referrals'], {
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase.from('referrals').select('*').eq('referrer_id', user.id)

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


  return {
    session,
    user,
    profile,
    avatarUrl,
    tags,
    referrals,
    updateProfile: () => refetch().then(() => {
      refetchTags()
      refetchReferrals()
    }),
    isLoadingSession,
    isLoadingProfile,
    isLoadingTags,
    isLoadingReferrals,
    isLoading: isLoadingSession || isLoadingProfile || isLoadingTags || isLoadingReferrals,
  }
}
