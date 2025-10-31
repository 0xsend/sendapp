import { useEffect, useState } from 'react'
import { isWeb, Stack, styled, useTheme } from 'tamagui'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
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
  const animatedProgress = useSharedValue(visible ? 0 : 0)
  const animatedOpacity = useSharedValue(visible ? 1 : 0)

  const insets = useSafeAreaInsets()
  const theme = useTheme()

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
      opacity: animatedOpacity.value,
    }
  }, [animatedProgress, animatedOpacity])

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 300 })
  }, [progress, animatedProgress])

  useEffect(() => {
    if (!render || (render && progress === 0)) {
      animatedOpacity.value = withTiming(0, { duration: 200 })
    } else {
      animatedOpacity.value = withTiming(1, { duration: 200 })
    }
  }, [render, progress, animatedOpacity])

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
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            backgroundColor: theme.primary.get(),
          },
          animatedStyle,
        ]}
      />
    </Stack>
  )
}
const IndicatorContainer = styled(Stack, {
  position: 'absolute',
  left: 0,
  w: '100%',
  pointerEvents: 'none',
  zIndex: 20,

  variants: {
    native: {
      true: {
        bottom: 0,
      },
      false: {
        top: 0,
      },
    },
  },
})

export const PendingIndicatorBar = ({ pending }: { pending: boolean }) => {
  const isNative = usePwa() || !isWeb

  return (
    <IndicatorContainer native={isNative}>
      <LoadingBar visible={pending} />
    </IndicatorContainer>
  )
}
