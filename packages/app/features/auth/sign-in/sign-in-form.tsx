// sign-in-form.tsx
import { BigHeading, H3, Paragraph, YStack } from '@my/ui'
import { useState } from 'react'
import { SignInButton } from '../components/SignInButton'

const formatErrorMessage = (error: Error) => {
  if (error.message.startsWith('The operation either timed out or was not allowed')) {
    return 'Passkey Authentication Failed'
  }
  return error.message
}

export const SignInForm = () => {
  const [error, setError] = useState<Error | null>(null)

  return (
    <YStack gap="$5" jc="center" $sm={{ f: 1 }}>
      <BigHeading color="$color12">WELCOME BACK</BigHeading>
      <H3
        lineHeight={28}
        $platform-web={{ fontFamily: '$mono' }}
        $theme-light={{ col: '$gray10Light' }}
        $theme-dark={{ col: '$olive' }}
        fontWeight={'300'}
        $sm={{ size: '$5' }}
      >
        Sign in with your passkey.
      </H3>

      <YStack gap="$4">
        <SignInButton setError={setError} />
        {error && <Paragraph color="$error">{formatErrorMessage(error)}</Paragraph>}
      </YStack>
    </YStack>
  )
}
