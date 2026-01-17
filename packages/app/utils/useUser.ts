import { useQuery } from '@tanstack/react-query'
import debug from 'debug'
import { useSessionContext } from './supabase/useSessionContext'
import { useSupabase } from './supabase/useSupabase'
import { useCallback, useMemo } from 'react'
import { useReplace } from 'app/utils/useReplace'

const log = debug('app:utils:useUser')

export const useUser = () => {
  const { session, isLoading: isLoadingSession } = useSessionContext()
  const user = session?.user
  const replace = useReplace()
  const supabase = useSupabase()

  // Enhance validation for the token
  const validateToken = useCallback(async () => {
    try {
      // Test token validity with a lightweight API call
      const { error } = await supabase.auth.getUser()
      if (error) {
        log('invalid token detected', error)
        await supabase.auth.signOut()
        replace('/')
        return false
      }
      return true
    } catch (e) {
      log('error validating token', e)
      await supabase.auth.signOut()
      replace('/')
      return false
    }
  }, [supabase.auth, replace])

  // Run validation on mount if we have a session
  useQuery({
    queryKey: ['validateToken', user?.id],
    queryFn: validateToken,
    enabled: !!session, // Only run when we have a session
    retry: false,
    staleTime: 60_000, // Cache validation for 1 minute
  })

  const queryFn = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        '*, tags(*), main_tag(*), links_in_bio(*), distribution_shares(*), canton_party_verifications(*), avatar_data, banner_data'
      )
      .eq('id', user?.id ?? '')
      .maybeSingle()

    if (error) {
      // check unauthorized or jwt error
      if (error.code === 'PGRST301' || error.code === 'PGRST401') {
        log('unauthorized or invalid JWT token')
        await supabase.auth.signOut()
        replace('/')
        return null
      }
      throw new Error(error.message)
    }
    if (!data) {
      log('no profile found for user', user?.id)
      return null
    }
    return data
  }, [supabase, user?.id, replace])

  const {
    data: profile,
    isLoading: isLoadingProfile,
    refetch,
  } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user?.id,
    queryFn,
  })

  const avatarUrl = useMemo(() => {
    // Prefer new avatar_data format (optimized variants)
    const avatarData = profile?.avatar_data as {
      processingStatus?: string
      variants?: { md?: { webp?: string } }
    } | null
    if (avatarData?.processingStatus === 'complete' && avatarData.variants?.md?.webp) {
      return avatarData.variants.md.webp
    }

    // Fall back to legacy avatar_url
    if (profile?.avatar_url) return profile.avatar_url
    if (typeof user?.user_metadata?.avatar_url === 'string') return user.user_metadata.avatar_url

    const params = new URLSearchParams()
    const name = profile?.name || user?.email || ''
    params.append('name', name)
    params.append('size', '256') // will be resized again by NextImage/SolitoImage
    return `https://ui-avatars.com/api?${params.toString()}&format=png&background=86ad7f`
  }, [
    profile?.avatar_data,
    profile?.avatar_url,
    profile?.name,
    user?.email,
    user?.user_metadata?.avatar_url,
  ])

  return {
    session,
    user,
    profile,
    avatarUrl,
    tags: profile?.tags,
    mainTag: profile?.main_tag,
    linksInBio: profile?.links_in_bio || [],
    distributionShares: profile?.distribution_shares || [],
    updateProfile: refetch,
    isLoadingSession,
    isLoadingProfile,
    isLoading: isLoadingSession || isLoadingProfile,
    validateToken,
  }
}

export type UseUserReturn = ReturnType<typeof useUser>
