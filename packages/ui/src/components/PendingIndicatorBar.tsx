import { useEffect, useRef, useState } from 'react'
import { isWeb, Portal, Stack, styled } from 'tamagui'
import { usePwa, useSafeAreaInsets } from '../utils'

// Progress cap to prevent infinite updates while pending
const PROGRESS_CAP = 0.95

// Get interval delay based on progress phase
const getIntervalDelay = (progress: number): number => {
  if (progress < 0.7) return 50 // Fast initial fill
  if (progress < 0.8) return 800
  if (progress < PROGRESS_CAP) return 1000
  return 0 // Stop at cap
}

// Get progress increment based on current phase
const getProgressIncrement = (progress: number): number => {
  if (progress < 0.7) return 0.1
  if (progress < 0.8) return 0.02
  if (progress < PROGRESS_CAP) return 0.01
  return 0 // Stop at cap
}

const LoadingBar = ({ visible }: { visible: boolean }) => {
  const [render, setRender] = useState(visible)
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)

  const translate = Math.max(0, 100 - Math.min(progress, 1) * 100)

  const insets = useSafeAreaInsets()

  // Use requestAnimationFrame with throttling for smooth progress updates
  useEffect(() => {
    if (!render || progress >= PROGRESS_CAP) {
      return
    }

    const tick = (timestamp: number) => {
      const delay = getIntervalDelay(progress)
      if (delay === 0) return // At cap, stop ticking

      if (timestamp - lastUpdateRef.current >= delay) {
        lastUpdateRef.current = timestamp
        const increment = getProgressIncrement(progress)
        if (increment > 0) {
          setProgress((p) => Math.min(p + increment, PROGRESS_CAP))
        }
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [progress, render])

  useEffect(() => {
    if (!visible) {
      const renderTimeoutId = setTimeout(() => {
        setRender(false)
      }, 200)
      const progressTimeoutId = setTimeout(() => {
        setProgress(0)
        lastUpdateRef.current = 0
      }, 500)

      setProgress(1)
      return () => {
        clearTimeout(renderTimeoutId)
        clearTimeout(progressTimeoutId)
      }
    }

    const timeoutId = setTimeout(() => {
      setProgress(0)
      lastUpdateRef.current = 0
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
        animation="100ms"
        x={`-${translate}%`}
        animateOnly={['transform']}
      />
    </Stack>
  )
}
const IndicatorContainer = styled(Stack, {
  left: 0,
  right: 0,
  w: '100%',
  pointerEvents: 'none',
  zIndex: 101, // Above BottomNavBar (zIndex 100), both in Portal stacking context

  variants: {
    pwa: {
      true: {
        // PWA: fixed at bottom, above the nav bar
        bottom: 0,
        '$platform-web': {
          position: 'fixed',
        },
      },
      false: {
        // Regular web: fixed at top
        top: 0,
        '$platform-web': {
          position: 'fixed',
        },
      },
    },
    native: {
      true: {
        // React Native: absolute at bottom
        position: 'absolute',
        bottom: 0,
      },
    },
  } as const,
})

export const PendingIndicatorBar = ({ pending }: { pending: boolean }) => {
  const isPwa = usePwa()
  const isNative = !isWeb

  return (
    <Portal zIndex={101}>
      <IndicatorContainer native={isNative} pwa={!isNative && isPwa}>
        <LoadingBar visible={pending} />
      </IndicatorContainer>
    </Portal>
  )
}
