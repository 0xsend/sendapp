/**
 * Onboarding screen will ultimately be the first screen a user sees when they open the app or after they sign up.
 *
 * It needs to:
 * - Introduce to Send
 * - Create a passkey
 * - Generate a deterministic address from the public key
 * - Ask the user to deposit funds
 */
import { Stack, YStack, Theme, useMedia } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { OnboardingForm } from './onboarding-form'
import { Carousel } from '../components/Carousel'
import { useAuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { useEffect, useState } from 'react'

export function OnboardingScreen() {
  const { carouselProgress } = useAuthCarouselContext()
  const media = useMedia()

  // workaround for now due to SSR issues with tamagui and this component
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  if (media.gtMd)
    return (
      <YStack f={3} jc="center" miw={0} maw={'100%'} space="$4" gap="$4">
        <YStack jc="flex-end" f={1} gap="$2" $gtMd={{ pb: '$8' }} ml="auto" w="100%" maw={738}>
          <Carousel currentKey={carouselProgress.toString()} fullscreen={false} />
        </YStack>
      </YStack>
    )

  return (
    <YStack w="100%" h={'100%'} jc="flex-start" pt="$7">
      <Stack $gtMd={{ dsp: 'none' }}>
        <IconSendLogo size={'$2'} color="$color12" />
      </Stack>

      <YStack f={3} jc="center" maw={'100%'} space="$4" gap="$4">
        <OnboardingForm />
      </YStack>
    </YStack>
  )
}
