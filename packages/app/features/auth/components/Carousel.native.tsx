import { H1, Paragraph, Progress, Stack, XStack } from '@my/ui'
import { AnimationLayout } from 'app/components/layout/animation-layout'
import { useContext, useEffect, useCallback, useRef } from 'react'
import { AuthCarouselContext } from '../AuthCarouselContext'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated'

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

const CarouselProgress = () => {
  const { carouselProgress, setCarouselProgress } = useContext(AuthCarouselContext)
  const progress = useSharedValue(0)
  const currentSlideRef = useRef(carouselProgress)

  const moveToNext = useCallback(() => {
    setCarouselProgress((prev) => (prev + 1) % carouselItems.length)
  }, [setCarouselProgress])

  // Update ref when carouselProgress changes
  useEffect(() => {
    currentSlideRef.current = carouselProgress
  }, [carouselProgress])

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
      {carouselItems?.map(({ title }, i) => {
        const animatedStyle = useAnimatedStyle(() => {
          let progressValue = 0

          if (currentSlideRef.current < i) {
            progressValue = 0
          } else if (currentSlideRef.current === i) {
            progressValue = progress.value
          } else {
            progressValue = 100
          }

          return {
            width: `${progressValue}%`,
          }
        }, [carouselProgress])

        return (
          <Progress
            key={title}
            f={1}
            h={1}
            backgroundColor={'$color3'}
            direction="ltr"
            miw={0}
            value={0} // We'll override this with animated style
          >
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
      })}
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
