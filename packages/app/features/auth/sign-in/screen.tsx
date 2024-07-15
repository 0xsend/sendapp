import { Anchor, Paragraph, XStack, YStack } from '@my/ui'
import { SignInForm } from 'app/features/auth/sign-in/sign-in-form'
import { useLink } from 'solito/link'

export const SignInScreen = () => {
  return (
    <YStack h="100%" jc="center" ai="center">
      <SignInForm />
      <XStack jc="center" ai="center" mt="$4">
        <Paragraph size="$2" color="$color11">
          Don&apos;t have an account?{' '}
          <Anchor color="$color12" {...useLink({ href: '/auth/sign-up' })}>
            Sign up
          </Anchor>
        </Paragraph>
      </XStack>
    </YStack>
  )
}
