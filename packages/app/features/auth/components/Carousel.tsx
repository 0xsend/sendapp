import { useContext, useEffect, useState } from 'react'
import { AuthCarouselContext } from '../AuthCarouselContext'
import { H1, Paragraph, Progress, Stack, XStack, useMedia } from '@my/ui'
import { AnimationLayout } from 'app/components/layout/animation-layout'

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
  { bottom: '0%', left: '75%' },
  { bottom: '0%', left: '35%' },
  { bottom: '0%', left: '50%' },
] as const

const CarouselProgress = () => {
  const { carouselProgress, setCarouselProgress } = useContext(AuthCarouselContext)
  const [progressWidth, setProgressWidth] = useState(0)

  useEffect(() => {
    const progressWidthInterval = setInterval(() => {
      setProgressWidth((progressWidth) => {
        return progressWidth >= 100 ? 0 : progressWidth + 1
      })
    }, 50)
    return () => {
      clearInterval(progressWidthInterval)
    }
  }, [])

  useEffect(() => {
    if (progressWidth >= 100) {
      setCarouselProgress((progress) => {
        return (progress + 1) % carouselItems?.length
      })
    }
  }, [progressWidth, setCarouselProgress])

  return (
    <XStack w="100%" jc="center" py="$5" gap="$2">
      {carouselItems?.map(({ title }, i) => {
        return (
          <Progress
            key={title}
            f={1}
            h={1}
            backgroundColor={'$gray500'}
            direction="ltr"
            miw={0}
            value={carouselProgress < i ? 0 : carouselProgress === i ? progressWidth : 100}
          >
            <Progress.Indicator animation="100ms" backgroundColor={'$white'} />
          </Progress>
        )
      })}
    </XStack>
  )
}
export const Carousel = (props: { currentKey: string | undefined; fullscreen: boolean }) => {
  const { carouselProgress } = useContext(AuthCarouselContext)
  const { gtMd } = useMedia()

  const item = carouselItems?.at(carouselProgress)

  return (
    <AnimationLayout
      currentKey={props.currentKey || 'none'}
      direction={1}
      fullscreen={props.fullscreen}
    >
      <Stack fd="column" $gtMd={{ fd: 'row', ai: 'flex-end' }} gap="$3">
        <H1 color="$white" fontWeight={'500'} $gtMd={{ w: '33%' }}>
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
      {gtMd && <CarouselProgress />}
    </AnimationLayout>
  )
}
