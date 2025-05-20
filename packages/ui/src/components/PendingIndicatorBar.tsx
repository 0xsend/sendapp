import { useEffect, useState } from 'react'
import { Stack } from 'tamagui'
import { usePwa, useSafeAreaInsets } from '../utils'

const getTimeout = (progress: number): number => {
  if (progress < 0.7) {
    return 0
  }
  if (progress < 0.8) {
    return 800
  }
  if (progress < 0.95) {
    return 1000
  }
  return 1500
}

const LoadingBar = ({ visible }: { visible: boolean }) => {
  const [render, setRender] = useState(visible)
  const [progress, setProgress] = useState(0)

  const translate = 100 - progress * 100

  const insets = useSafeAreaInsets()

  useEffect(() => {
    if (render) {
      const timeoutId = setTimeout(() => {
        setProgress((currentProgress) => {
          if (currentProgress < 0.7) {
            return currentProgress + 0.7
          }
          if (currentProgress < 0.8) {
            return currentProgress + 0.05
          }
          if (currentProgress < 0.95) {
            return currentProgress + 0.025
          }
          return currentProgress + 0.005
        })
      }, getTimeout(progress))
      return () => clearTimeout(timeoutId)
    }
  }, [progress, render])

  useEffect(() => {
    if (!visible) {
      const renderTimeoutId = setTimeout(() => {
        setRender(false)
      }, 200)
      const progressTimeoutId = setTimeout(() => {
        setProgress(0)
      }, 500)

      setProgress(1)
      return () => {
        clearTimeout(renderTimeoutId)
        clearTimeout(progressTimeoutId)
      }
    }

    const timeoutId = setTimeout(() => {
      setProgress(0)
      setRender(true)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [visible])

  return (
    <Stack w="100%" h={insets.bottom > 0 ? '$0.75' : '$0.5'} overflow="hidden" position="relative">
      <Stack
        position="absolute"
        top={0}
        left={0}
        bottom={0}
        width="100%"
        bc="$primary"
        opacity={!render || (render && progress === 0) ? 0 : 1}
        animation="quick"
        transformStyle="preserve-3d"
        x={`-${translate}%`}
        animateOnly={['transform']}
      />
    </Stack>
  )
}

export const PendingIndicatorBar = ({ pending }: { pending: boolean }) => {
  const isPwa = usePwa()

  const placement = isPwa ? { bottom: 0 } : { top: 0 }

  return (
    <Stack
      position="absolute"
      left={0}
      w="100%"
      pointerEvents="none"
      zIndex={20}
      {...placement}
      $platform-native={{ bottom: 0 }}
    >
      <LoadingBar visible={pending} />
    </Stack>
  )
}
