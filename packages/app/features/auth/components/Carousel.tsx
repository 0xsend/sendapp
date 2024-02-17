import { useContext, useEffect, useState } from 'react'
import { AuthCarouselContext } from '../AuthCarouselContext'
import { H1, Paragraph, Progress, Stack, XStack, useMedia } from '@my/ui'

const carouselItems = [
  {
    title: 'LIKE CASH',
    description: 'SEND AND RECEIVE MONEY GLOBALLY IN SECONDS',
  },
  {
    title: 'ALL YOURS',
    description: 'ONLY YOU HAVE ACCESS TO YOUR FUNDS',
  },
  {
    title: 'SECURE',
    description: 'PRIVACY FIRST WITH VERFIED SIGN-IN AND TRANSFERS',
  },
] as const

const CarouselProgress = () => {
  const { carouselProgress, setCarouselProgress } = useContext(AuthCarouselContext)
  const [progressWidth, setProgressWidth] = useState(0)

  useEffect(() => {
    const progressWidthInterval = setInterval(() => {
      setProgressWidth((progressWidth) => {
        return progressWidth >= 100 ? 0 : progressWidth + 1
      })
      if (progressWidth >= 100) {
        setCarouselProgress((progress) => (progress + 1) % carouselItems?.length)
      }
    }, 50)

    return () => {
      clearInterval(progressWidthInterval)
    }
  }, [setCarouselProgress, progressWidth])

  return (
    <XStack w="100%" jc="center" py="$5" gap="$2">
      {carouselItems?.map(({ title }, i) => {
        return (
          <Progress
            key={title}
            f={1}
            h={1}
            backgroundColor={'$background'}
            direction="ltr"
            value={carouselProgress < i ? 0 : carouselProgress === i ? progressWidth : 100}
          >
            <Progress.Indicator animation="100ms" backgroundColor={'$white'} />
          </Progress>
        )
      })}
    </XStack>
  )
}
export const Carousel = () => {
  const { carouselProgress } = useContext(AuthCarouselContext)
  const { gtMd } = useMedia()

  const item = carouselItems?.at(carouselProgress)

  return (
    <>
      <Stack fd="column" $gtMd={{ fd: 'row', jc: 'space-between', ai: 'center' }} gap="$3">
        <H1 fontWeight={'bold'} color="$white">
          {item?.title}
        </H1>
        <Paragraph
          $gtMd={{ ta: 'right' }}
          pr="$5"
          fontSize="$2"
          $gtXs={{ fontSize: '$4' }}
          fontWeight={'normal'}
          color="$white"
        >
          {item?.description}
        </Paragraph>
      </Stack>
      {gtMd && <CarouselProgress />}
    </>
  )
}
