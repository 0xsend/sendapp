import {
  Stack,
  YStack,
  Button,
  ButtonText,
  XStack,
  useMedia,
  useWindowDimensions,
  H1,
  Progress,
  Paragraph,
} from '@my/ui'
import { IconSendLogo } from 'app/components/icons'

import { useContext, useEffect, useState } from 'react'
import { SignInForm } from './sign-in-form'
import { AnimationLayout } from 'app/components/layout/animation-layout'
import { AuthCarouselContext } from './AuthCarouselContext'

const screens = ['screen1', 'screen2', 'screen3', 'signin'] as const

export const SignInScreen = () => {
  const { height: windowHeight } = useWindowDimensions()
  const { carouselProgress } = useContext(AuthCarouselContext)

  const getSignInPage = (page: (typeof screens)[number] | undefined) => {
    switch (true) {
      case page === 'screen1' || page === 'screen2' || page === 'screen3':
        return <SignInCarousel />
      case page === 'signin':
        return <SignInForm />
      default:
        return <SignInCarousel />
    }
  }

  return (
    <YStack w="100%" h={windowHeight} jc="flex-start" p="$7">
      <Stack f={1} $gtMd={{ dsp: 'none' }}>
        <IconSendLogo size={'$2'} color="$white" />
      </Stack>
      <AnimationLayout currentKey={screens[carouselProgress] || 'none'} direction={1}>
        {getSignInPage(screens[carouselProgress])}
      </AnimationLayout>
    </YStack>
  )
}

const ContinueButton = () => {
  const { setCarouselProgress } = useContext(AuthCarouselContext)
  return (
    <Stack w="100%" jc="center" $gtMd={{ dsp: 'none' }} py="$5" gap="$2">
      <Button
        bg="transparent"
        bw={1}
        borderColor={'$accentBackground'}
        f={1}
        br="$5"
        onPress={() => setCarouselProgress((progress) => (progress + 1) % carouselItems.length)}
      >
        <ButtonText col={'$accentBackground'}>CONTINUE</ButtonText>
      </Button>
    </Stack>
  )
}

const SignInButtons = () => {
  const { setCarouselProgress } = useContext(AuthCarouselContext)
  return (
    <XStack w="100%" jc="center" $gtMd={{ dsp: 'none' }} py="$5" gap="$2">
      <Button
        f={1}
        bg="$accentBackground"
        br="$5"
        onPress={() => setCarouselProgress(carouselItems.length)}
      >
        <ButtonText col="$background">LOGIN</ButtonText>
      </Button>
      <Button
        bg="transparent"
        bw={1}
        borderColor={'$accentBackground'}
        f={1}
        br="$5"
        onPress={() => setCarouselProgress(carouselItems.length)}
      >
        <ButtonText col={'$accentBackground'}>SIGN UP</ButtonText>
      </Button>
    </XStack>
  )
}

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
]

const CarouselProgress = () => {
  const { carouselProgress, setCarouselProgress } = useContext(AuthCarouselContext)
  const [progressWidth, setProgressWidth] = useState(0)

  useEffect(() => {
    const progressWidthInterval = setInterval(() => {
      setProgressWidth((progressWidth) => {
        return progressWidth >= 100 ? 0 : progressWidth + 1
      })
      if (progressWidth >= 100) {
        setCarouselProgress((progress) => (progress + 1) % carouselItems.length)
      }
    }, 50)

    return () => {
      clearInterval(progressWidthInterval)
    }
  }, [setCarouselProgress, progressWidth])

  return (
    <XStack w="100%" jc="center" py="$5" gap="$2">
      {carouselItems.map(({ title }, i) => {
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

const SignInCarousel = () => {
  const { carouselProgress } = useContext(AuthCarouselContext)
  const { gtMd } = useMedia()

  const item = carouselItems.at(carouselProgress)

  return (
    <YStack jc="flex-end" f={1} gap="$2" $gtMd={{ pb: '$8' }} mx="auto" maw={738}>
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
      {gtMd ? (
        <CarouselProgress />
      ) : carouselProgress < carouselItems.length - 1 ? (
        <ContinueButton />
      ) : (
        <SignInButtons />
      )}
    </YStack>
  )
}
