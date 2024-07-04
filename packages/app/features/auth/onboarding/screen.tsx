/**
 * Onboarding screen will ultimately be the first screen a user sees when they open the app or after they sign up.
 *
 * It needs to:
 * - Introduce to Send
 * - Create a passkey
 * - Generate a deterministic address from the public key
 * - Ask the user to deposit funds
 */
import { YStack } from '@my/ui'
import { OnboardingForm } from './onboarding-form'

export function OnboardingScreen() {
  return (
    <YStack h="100%" jc="center" ai="center">
      <OnboardingForm />
    </YStack>
  )
}
