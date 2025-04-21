import { YStack } from '@my/ui'
import { SignUpForm } from 'app/features/auth/sign-up/sign-up-form'

export const SignUpScreen = () => {
  return (
    <YStack f={1} maxWidth={600}>
      <SignUpForm />
    </YStack>
  )
}
