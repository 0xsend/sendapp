import { YStack } from '@my/ui'
import { SignUpForm } from 'app/features/auth/sign-up/sign-up-form'

export const SignUpScreen = () => {
  return (
    <YStack h="100%" jc="center" ai="center" f={1}>
      <SignUpForm />
    </YStack>
  )
}
