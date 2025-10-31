import { H1, Paragraph, Progress, Stack, XStack } from '@my/ui'
import { AnimationLayout } from 'app/components/layout/animation-layout'
import { useContext, useEffect, useCallback } from 'react'
import { AuthCarouselContext } from '../AuthCarouselContext'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated'
import type { SharedValue } from 'react-native-reanimated'

const carouselItems = [
  {
    title: 'Like Cash',
    description: 'Send and receive money globally in seconds',
    descriptionFontSize: 16,
  },
  {
    title: 'All Yours',
    description: 'Only you have access to your funds',
    descriptionFontSize: 18,
  },
  {
    title: 'Secure',
    description: 'Privacy first with verified sign-in and transfers',
    descriptionFontSize: 16,
  },
] as const

export const carouselImagePositions = [
  { bottom: '0%', left: '50%' },
  { bottom: '0%', left: '35%' },
  { bottom: '0%', left: '75%' },
] as const

const PROGRESS_DURATION = 5000 // 5 seconds per slide

// Separate child component so hooks are called at top level per segment
const CarouselProgressSegment = ({
  index,
  title,
  progress,
  currentSlide,
}: {
  index: number
  title: string
  progress: SharedValue<number>
  currentSlide: number
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    let progressValue = 0

    if (currentSlide < index) {
      progressValue = 0
    } else if (currentSlide === index) {
      progressValue = progress.value
    } else {
      progressValue = 100
    }

    return {
      width: `${progressValue}%`,
    }
  }, [currentSlide, index, progress.value])

  return (
    <Progress key={title} f={1} h={1} backgroundColor={'$color3'} direction="ltr" miw={0} value={0}>
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: 'white',
          },
          animatedStyle,
        ]}
      />
    </Progress>
  )
}

const CarouselProgress = () => {
  const { carouselProgress, setCarouselProgress } = useContext(AuthCarouselContext)
  const progress = useSharedValue(0)

  const moveToNext = useCallback(() => {
    setCarouselProgress((prev) => (prev + 1) % carouselItems.length)
  }, [setCarouselProgress])

  useEffect(() => {
    // Cancel any existing animation
    cancelAnimation(progress)

    // Reset and start animation
    progress.value = 0
    progress.value = withTiming(100, { duration: PROGRESS_DURATION }, (finished) => {
      if (finished) {
        runOnJS(moveToNext)()
      }
    })
  }, [moveToNext, progress])

  return (
    <XStack w="100%" jc="center" py="$5" gap="$2">
      {carouselItems?.map(({ title }, i) => (
        <CarouselProgressSegment
          key={title}
          title={title}
          index={i}
          progress={progress}
          currentSlide={carouselProgress}
        />
      ))}
    </XStack>
  )
}

export const Carousel = (props: { currentKey: string | undefined; fullscreen: boolean }) => {
  const { carouselProgress } = useContext(AuthCarouselContext)

  const item = carouselItems?.at(carouselProgress)

  return (
    <AnimationLayout
      currentKey={props.currentKey || 'none'}
      direction={1}
      fullscreen={props.fullscreen}
    >
      <Stack fd="column" $gtMd={{ fd: 'row', ai: 'flex-end' }} gap="$3">
        <H1 color="$white" fontWeight={'500'} $gtMd={{ w: '33%' }} lineHeight={42}>
          {item?.title}
        </H1>
        <Paragraph
          $gtMd={{ ta: 'left', pb: '$2', fontSize: item?.descriptionFontSize, w: '66%' }}
          fontSize={20}
          fontWeight={'200'}
          fontFamily={'$mono'}
          lh={28}
          color="$white"
        >
          {item?.description}
        </Paragraph>
      </Stack>
      <CarouselProgress />
    </AnimationLayout>
  )
}
