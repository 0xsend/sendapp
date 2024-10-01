import {
  XStack,
  Stack,
  styled,
  type XStackProps,
  AnimatePresence,
  LinearGradient,
  usePwa,
} from '@my/ui'
import { useState } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

const Row = styled(XStack, {
  w: '100%',
  ai: 'center',
  mx: 'auto',
  jc: 'space-around',
  gap: '$4',
  maw: 768,
  $gtLg: {
    pt: '$4',
  },
})

export const MobileButtonRow = ({
  isVisible = true,
  isLoading = false,
  children,
  ...props
}: XStackProps & { isVisible?: boolean; isLoading?: boolean }) => {
  const isPwa = usePwa()
  return (
    <AnimatePresence>
      {!isLoading && isVisible && (
        <Stack
          w={'100%'}
          pb={isPwa ? '$1' : '$5'}
          px="$4"
          $platform-web={{
            position: 'fixed',
            bottom: 0,
          }}
          $gtLg={{
            display: 'none',
          }}
          animation="200ms"
          opacity={1}
          animateOnly={['scale', 'transform', 'opacity']}
          enterStyle={{ opacity: 0, scale: 0.9 }}
          exitStyle={{ opacity: 0, scale: 0.95 }}
        >
          <LinearGradient
            h={'150%'}
            top={'-50%'}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            locations={[0, 0.33]}
            fullscreen
            colors={['transparent', '$background']}
            $gtLg={{ display: 'none' }}
          />
          <Row {...props}>{children}</Row>
        </Stack>
      )}
    </AnimatePresence>
  )
}

export const useScrollToggle = () => {
  const [isVisible, setIsVisible] = useState(true)

  const [, setScrollY] = useState(0)

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    const isEndOfView = layoutMeasurement.height + contentOffset.y >= contentSize.height - 50
    setScrollY((prev) => {
      if ((prev > contentOffset.y && !isEndOfView) || contentOffset.y < 50) {
        setIsVisible(true)
      } else if (prev < e.nativeEvent.contentOffset.y || isEndOfView) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
      return e.nativeEvent.contentOffset.y
    })
  }

  return {
    isVisible,
    onScroll,
  }
}
