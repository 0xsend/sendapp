import { useCallback } from 'react'
import { Button, H2, Paragraph, YStack } from '@my/ui'
import { useRouter } from 'solito/router'

interface Props {
  error?: Error
  resetError?: () => void
}

export function ErrorFallback({ error, resetError }: Props) {
  const router = useRouter()

  const handleGoHome = useCallback(() => {
    router.replace('/')
    // Reset after navigation to avoid immediately re-rendering the crashing tree
    setTimeout(() => resetError?.(), 0)
  }, [router, resetError])

  return (
    <YStack flex={1} justifyContent="center" alignItems="center" padding="$4" gap="$4">
      <H2>Something went wrong</H2>
      <Paragraph color="$gray10" textAlign="center">
        An unexpected error occurred. Please try again.
      </Paragraph>
      {__DEV__ && error && (
        <Paragraph color="$red10" fontSize="$2" fontFamily="$mono">
          {error.message}
        </Paragraph>
      )}
      <Button onPress={handleGoHome} theme="green">
        Go Home
      </Button>
    </YStack>
  )
}
