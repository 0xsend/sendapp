/**
 * Onboarding screen will ultimately be the first screen a user sees when they open the app or after they sign up.
 *
 * It needs to:
 * - Introduce to Send
 * - Create a passkey
 * - Generate a deterministic address from the public key
 * - Ask the user to deposit funds
 */
import { Stack, YStack, useMedia } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { OnboardingForm } from './onboarding-form'
import { Carousel } from '../components/Carousel'
import { useAuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { useEffect, useState } from 'react'

export function OnboardingScreen() {
  return (
    <YStack h="100%" jc="center" ai="center">
      <OnboardingForm />
    </YStack>
  )
}
