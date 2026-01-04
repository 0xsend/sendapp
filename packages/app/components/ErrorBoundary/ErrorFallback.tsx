import { useCallback, useState } from 'react'
import { Button, H2, Paragraph, YStack } from '@my/ui'
import { Image, type ImageSourcePropType } from 'react-native'
import { useRouter } from 'solito/router'

// Handle different module formats for cross-platform compatibility
function getImageSource(): ImageSourcePropType {
  let source: ImageSourcePropType = require('./error-robot.png')
  if (typeof source === 'object' && source !== null) {
    if ('default' in source) {
      source = (source as { default: ImageSourcePropType }).default
    }
    if (typeof source === 'object' && source !== null && 'src' in source) {
      source = { uri: (source as { src: string }).src }
    }
  }
  return source
}

const errorRobotImage = getImageSource()

/**
 * Temporary component to test error boundary UI.
 * Remove after testing.
 */
export function CrashTestButton() {
  const [shouldCrash, setShouldCrash] = useState(false)

  if (shouldCrash) {
    throw new Error('Test error boundary crash')
  }

  if (!__DEV__) return null

  return (
    <Button size="$2" theme="red" onPress={() => setShouldCrash(true)}>
      🔴 Test Crash
    </Button>
  )
}

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
      <Image source={errorRobotImage} style={{ width: 200, height: 200 }} resizeMode="contain" />
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
