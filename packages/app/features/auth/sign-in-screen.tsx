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
} from '@my/ui'
import { IconSendLogo } from 'app/components/icons'

import { useContext, useEffect } from 'react'
import { SignInForm } from './sign-in-form'
import { AnimationLayout } from 'app/components/layout/animation-layout'
import { AuthCarouselContext } from './AuthCarouselContext'

const screens = ['instant-payments', 'qrcode-payments', 'realtime-payments', 'sign-in-form']

export const SignInScreen = () => {
  const { height: windowHeight } = useWindowDimensions()
  const { carouselProgress } = useContext(AuthCarouselContext)

  const getSignInPage = (page: string | undefined) => {
    switch (true) {
      case page === 'instant-payments' || page === 'qrcode-payments':
        return <SignInCarousel buttonRow={<ContinueButton />} />
      case page === 'realtime-payments':
        return <SignInCarousel buttonRow={<SignInButtons />} />
      case page === 'sign-in-form':
        return <SignInForm />
      default:
        return <SignInCarousel />
    }
  }

  return (
    <YStack w="100%" h={windowHeight} jc="space-around" mb="auto" mt="auto">
      <AnimationLayout currentKey={screens[carouselProgress] || 'none'} direction={1}>
        <Stack py="$5" ai="center" $gtMd={{ dsp: 'none' }}>
          <IconSendLogo size={'$5'} color="$white" />
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
        f={1}
        onPress={() => setCarouselProgress((progress) => (progress + 1) % carouselItems.length)}
      >
        <ButtonText fontWeight={'bold'}>Continue</ButtonText>
      </Button>
    </Stack>
  )
}

const SignInButtons = () => {
  const { setCarouselProgress } = useContext(AuthCarouselContext)
  return (
    <XStack w="100%" jc="center" $gtMd={{ dsp: 'none' }} py="$5" gap="$2">
      <Button f={1} onPress={() => setCarouselProgress(carouselItems.length)}>
        <ButtonText fontWeight={'bold'} col="$backgroundStrong">
          Login
        </ButtonText>
      </Button>
      <Button
        f={1}
        bc="background05"
        borderColor="$backgroundStrong"
        bw={'$1'}
        onPress={() => setCarouselProgress(carouselItems.length)}
      >
        <ButtonText fontWeight={'bold'} col="$backgroundStrong">
          Sign up
        </ButtonText>
      </Button>
    </XStack>
  )
}

const carouselItems = [
  {
    line1: 'INSTANT',
    line2: 'PAYMENTS',
    description: 'INFRASTRUCTURE FOR MERCHANTS AND STABLECOIN TRANSACTIONS',
  },
  {
    line1: 'QRCODE',
    line2: 'PAYMENTS',
    description: 'INFRASTRUCTURE FOR MERCHANTS AND STABLECOIN TRANSACTIONS',
  },
  {
    line1: 'REAL TIME',
    line2: 'PAYMENTS',
    description: 'INFRASTRUCTURE FOR MERCHANTS AND STABLECOIN TRANSACTIONS',
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
        <YStack jc="flex-end" h="100%">
          <Text fontSize="$8" $gtXs={{ fontSize: '$13' }} fontWeight={'bold'} color="$white">
            {item?.line1}
          </Text>
          <Text
            fontSize="$2"
            $gtXs={{ fontSize: '$8', maw: '55%' }}
            fontWeight={'normal'}
            maw="70%"
            color="$green5Light"
          >
            {item?.description}
          </Text>
          {buttonRow}
        </YStack>
      </Stack>
    </View>
  )
}
