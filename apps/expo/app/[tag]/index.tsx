import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { ProfileScreen } from 'app/features/profile/screen'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { useProfileLookup } from 'app/utils/useProfileLookup'
import { SendtagSchema } from 'app/utils/zod/sendtag'
import { useEffect, useMemo } from 'react'
import { useUser } from 'app/utils/useUser'
import { useSetReferralCode } from 'app/utils/useReferralCode'
import { Spinner, YStack } from '@my/ui'

/**
 * Dynamic route for tag-based profile URLs (e.g., /musidlo)
 * This enables deep links like https://send.app/musidlo to work on native
 */
export default function TagProfileScreen() {
  const { tag: tagParam } = useLocalSearchParams<{ tag: string }>()
  const router = useRouter()
  const { session } = useUser()
  const { mutateAsync: setReferralCodeMutateAsync } = useSetReferralCode()

  // Validate the tag
  const validatedTag = useMemo(() => {
    if (!tagParam) return undefined
    // Handle optional @ prefix (same as web: apps/next/pages/[tag]/index.tsx)
    const tagName = tagParam.startsWith('@') ? tagParam.slice(1) : tagParam
    const result = SendtagSchema.safeParse({ name: tagName })
    return result.success ? result.data.name : undefined
  }, [tagParam])

  // Look up profile by tag (only when we have a valid tag)
  const { data: profile, isLoading, error } = useProfileLookup('tag', validatedTag ?? '')

  // Set referral code for anonymous users viewing a profile
  useEffect(() => {
    if (!session && validatedTag) {
      void setReferralCodeMutateAsync(validatedTag)
    }
  }, [session, validatedTag, setReferralCodeMutateAsync])

  // Handle invalid tag format - redirect to not found
  useEffect(() => {
    if (tagParam && !validatedTag) {
      router.replace('/+not-found')
    }
  }, [tagParam, validatedTag, router])

  // Handle profile not found - redirect to sign-up with tag pre-filled
  useEffect(() => {
    if (!isLoading && !profile && validatedTag && !error) {
      router.replace(`/auth/sign-up?tag=${encodeURIComponent(validatedTag)}`)
    }
  }, [isLoading, profile, validatedTag, error, router])

  // Handle private profiles for anonymous users
  useEffect(() => {
    if (!isLoading && profile && !profile.is_public && !session) {
      router.replace('/+not-found')
    }
  }, [isLoading, profile, session, router])

  // Show loading state while fetching or before redirect
  if (isLoading || !profile) {
    return (
      <>
        <Stack.Screen
          options={{
            title: '',
            headerShown: true,
          }}
        />
        <ScreenContainer>
          <YStack flex={1} justifyContent="center" alignItems="center">
            <Spinner size="large" />
          </YStack>
        </ScreenContainer>
      </>
    )
  }

  // Show profile
  const sendid = profile.sendid ?? undefined
  return (
    <>
      <Stack.Screen
        options={{
          title: profile.name ?? profile.main_tag_name ?? `#${sendid}`,
          headerShown: true,
        }}
      />
      <ScreenContainer>
        <ProfileScreen sendid={sendid} />
      </ScreenContainer>
    </>
  )
}
