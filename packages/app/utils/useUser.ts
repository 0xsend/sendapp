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
  } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id ?? '')
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          await supabase.auth.signOut()
          return null
        }
        if (profileError.code === 'PGRST301') {
          await supabase.auth.signOut()
        }
        throw new Error(profileError.message)
      }

      const { data: sendAccountData } = await supabase
        .from('send_accounts')
        .select(`
          main_tag_id,
          tags (
            name
          )
        `)
        .eq('user_id', user?.id ?? '')
        .single()

      return {
        ...profileData,
        main_tag_name: sendAccountData?.tags?.name,
      }
    },
  })

  const {
    data: tags,
    isLoading: isLoadingTags,
    refetch: refetchTags,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('*').neq('status', 'available')

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
