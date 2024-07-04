import { YStack, Anchor, Paragraph, XStack } from '@my/ui'
import { SignUpForm } from 'app/features/auth/sign-up/sign-up-form'
import { useLink } from 'solito/link'

export const SignUpScreen = () => {
  return (
    <YStack h="100%" jc="center" ai="center" f={1}>
      <SignUpForm />
      <XStack jc="center" ai="center" mt="$4">
        <Paragraph size="$2" color="$color11">
          Already have an account?{' '}
          <Anchor color="$color12" {...useLink({ href: '/auth/sign-in' })}>
            Sign in
          </Anchor>
        </Paragraph>
      </XStack>
    </YStack>
  )
}
