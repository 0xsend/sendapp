import { useEffect, useState } from 'react'
import { Stack, styled } from 'tamagui'
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
      // Complete the bar instantly, then hide
      setProgress(1)
      const renderTimeoutId = setTimeout(() => {
        setRender(false)
        setProgress(0)
      }, 200)

      return () => {
        clearTimeout(renderTimeoutId)
      }
    }

    // Show and start from 0
    setRender(true)
    setProgress(0)
  }, [visible])

  return (
    <Stack w="100%" h={insets.bottom > 0 ? '$0.75' : '$0.5'} overflow="hidden" position="relative">
      {render && progress > 0 && (
        <Stack
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          width={`${progress * 100}%`}
          bc="$primary"
          animation="fastHeavy"
          animateOnly={['width']}
          enterStyle={{ width: '0%' }}
        />
      )}
    </Stack>
  )
}

const IndicatorContainer = styled(Stack, {
  position: 'absolute',
  left: 0,
  top: 0,
  w: '100%',
  pointerEvents: 'none',
  zIndex: 20,
})

export const PendingIndicatorBar = ({ pending }: { pending: boolean }) => {
  return (
    <IndicatorContainer>
      <LoadingBar visible={pending} />
    </IndicatorContainer>
  )
}
