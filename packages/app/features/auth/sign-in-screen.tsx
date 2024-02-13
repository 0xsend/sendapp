import {
  Stack,
  View,
  YStack,
  Button,
  ButtonText,
  XStack,
  useMedia,
  Text,
  useWindowDimensions,
  H1,
} from '@my/ui'
import { IconSendLogo } from 'app/components/icons'

import { useContext, useEffect } from 'react'
import { SignInForm } from './sign-in-form'
import { AnimationLayout } from 'app/components/layout/animation-layout'
import { AuthCarouselContext } from './AuthCarouselContext'

const screens = ['screen1', 'screen2', 'screen3', 'onboarding'] as const

export const SignInScreen = () => {
  const { height: windowHeight } = useWindowDimensions()
  const { carouselProgress } = useContext(AuthCarouselContext)

  const getSignInPage = (page: (typeof screens)[number] | undefined) => {
    switch (true) {
      case page === 'screen1' || page === 'screen2':
        return <SignInCarousel buttonRow={<ContinueButton />} />
      case page === 'screen3':
        return <SignInCarousel buttonRow={<SignInButtons />} />
      case page === 'onboarding':
        return <SignInForm />
      default:
        return <SignInCarousel />
    }
  }

  return (
    <YStack w="100%" h={windowHeight} jc="space-around" mb="auto" mt="auto">
      <AnimationLayout currentKey={screens[carouselProgress] || 'none'} direction={1}>
        <Stack pt="$10" pl="$3" $gtMd={{ dsp: 'none' }}>
          <IconSendLogo size={'$2'} color="$white" />
        </Stack>
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
    line1: 'LIKE CASH',
    description: 'SEND AND RECEIVE MONEY GLOBALLY IN SECONDS',
  },
  {
    line1: 'ALL YOURS',
    description: 'ONLY YOU HAVE ACCESS TO YOUR FUNDS',
  },
  {
    line1: 'SECURE',
    description: 'PRIVACY FIRST WITH VERFIED SIGN-IN AND TRANSFERS',
  },
]

const SignInCarousel = ({
  buttonRow,
}: {
  buttonRow?: React.ReactNode
}) => {
  const media = useMedia()
  const { carouselProgress, setCarouselProgress } = useContext(AuthCarouselContext)

  useEffect(() => {
    if (media.gtMd) {
      const interval = setInterval(() => {
        setCarouselProgress((progress) => (progress + 1) % carouselItems.length)
      }, 7500)
      return () => clearInterval(interval)
    }
  }, [media, setCarouselProgress])

  const item = carouselItems.at(carouselProgress)

  return (
    <View pos="absolute" h={'100%'} w={'100%'} top={0} left={0} mt="auto" mb="auto" zIndex={-1}>
      <Stack mt="auto" mb="auto" w="100%" h="100%">
        <YStack jc="flex-end" h="100%" gap="$6">
          <YStack gap="$3" maw="75%">
            <H1 fontWeight={'bold'} color="$white">
              {item?.line1}
            </H1>
            <Text
              fontSize="$2"
              $gtXs={{ fontSize: '$8', maw: '55%' }}
              fontWeight={'normal'}
              color="$green5Light"
            >
              {item?.description}
            </Text>
          </YStack>
          {buttonRow}
        </YStack>
      </Stack>
    </View>
  )
}
