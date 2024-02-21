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
import { SolitoImage } from 'solito/image'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { SignInForm } from './sign-in-form'
import { AnimationLayout } from 'app/components/layout/animation-layout'
import { InferGetStaticPropsType } from 'next'
import { getServerSideProps } from '../../../../apps/next/pages/sign-in'

const screens = ['instant-payments', 'qrcode-payments', 'realtime-payments', 'sign-in-form']

export const SignInScreen = ({ images }: InferGetStaticPropsType<typeof getServerSideProps>) => {
  const { height: windowHeight } = useWindowDimensions()
  const [signInProgress, setSignInProgress] = useState(0)
  const media = useMedia()

  const incrementProgress = () => {
    setSignInProgress((i) => (i + 1) % carouselItems.length)
  }

  const decrementProgress = () => {
    setSignInProgress((i) => (i - 1 + carouselItems.length) % carouselItems.length)
  }

  const getSignInPage = (page: string | undefined) => {
    switch (true) {
      case page === 'instant-payments' || page === 'qrcode-payments':
        return (
          <SignInCarousel
            signInProgress={signInProgress}
            buttonRow={<ContinueButton incrementProgress={incrementProgress} />}
          >
            <CarouselImage
              image={images[signInProgress]?.img}
              imageBase64={images[signInProgress]?.base64}
            />
          </SignInCarousel>
        )
      case page === 'realtime-payments':
        return (
          <SignInCarousel
            signInProgress={signInProgress}
            buttonRow={<SignInButtons setSignInProgress={setSignInProgress} />}
          >
            <CarouselImage
              image={images[signInProgress]?.img}
              imageBase64={images[signInProgress]?.base64}
            />
          </SignInCarousel>
        )
      case page === 'sign-in-form':
        return <SignInForm />
      default:
        return (
          <SignInCarousel signInProgress={0}>
            {' '}
            <CarouselImage image={images[0]?.img} imageBase64={images[0]?.base64} />{' '}
          </SignInCarousel>
        )
    }
  }

  return (
    <YStack w="100%" h={windowHeight} jc="space-around" mb="auto" mt="auto">
      <AnimationLayout currentKey={screens[signInProgress] || 'none'} direction={1}>
        <Stack py="$5" ai="center" $gtMd={{ dsp: 'none' }}>
          <IconSendLogo size={'$5'} color="$white" />
        </Stack>
        {getSignInPage(screens[signInProgress])}
      </AnimationLayout>
    </YStack>
  )
}

const ContinueButton = ({ incrementProgress }: { incrementProgress: () => void }) => (
  <Stack w="100%" jc="center" $gtMd={{ dsp: 'none' }} py="$5" gap="$2">
    <Button f={1} onPress={incrementProgress}>
      <ButtonText fontWeight={'bold'}>Continue</ButtonText>
    </Button>
  </Stack>
)

const SignInButtons = ({
  setSignInProgress,
}: { setSignInProgress: Dispatch<SetStateAction<number>> }) => (
  <XStack f={1} w="100%" jc="center" $gtMd={{ dsp: 'none' }} py="$5" gap="$2">
    <Button f={1} onPress={() => setSignInProgress(3)}>
      <ButtonText fontWeight={'bold'} col="$backgroundStrong">
        Login
      </ButtonText>
    </Button>
    <Button
      f={1}
      bc="background05"
      borderColor="$backgroundStrong"
      bw={'$1'}
      onPress={() => setSignInProgress(3)}
    >
      <ButtonText fontWeight={'bold'} col="$backgroundStrong">
        Sign up
      </ButtonText>
    </Button>
  </XStack>
)

const carouselItems = [
  {
    url: 'https://github.com/0xsend/assets/blob/main/app_images/bg_image_dark_1.jpg?raw=true',
    line1: 'INSTANT',
    line2: 'PAYMENTS',
    description: 'INFRASTRUCTURE FOR MERCHANTS AND STABLECOIN TRANSACTIONS',
  },
  {
    url: 'https://github.com/0xsend/assets/blob/main/app_images/bg_image_dark_1.jpg?raw=true',
    line1: 'QRCODE',
    line2: 'PAYMENTS',
    description: 'INFRASTRUCTURE FOR MERCHANTS AND STABLECOIN TRANSACTIONS',
  },
  {
    url: 'https://github.com/0xsend/assets/blob/main/app_images/bg_image_dark_1.jpg?raw=true',
    line1: 'REAL TIME',
    line2: 'PAYMENTS',
    description: 'INFRASTRUCTURE FOR MERCHANTS AND STABLECOIN TRANSACTIONS',
  },
]

const SignInCarousel = ({
  signInProgress = 0,
  setSignInProgress,
  children,
  buttonRow,
}: {
  signInProgress: number
  setSignInProgress?: Dispatch<SetStateAction<number>> | undefined
  buttonRow?: React.ReactNode
  children?: React.ReactNode
}) => {
  const media = useMedia()

  useEffect(() => {
    if (media.gtMd) {
      const interval = setInterval(() => {
        setSignInProgress?.((progress) => (progress + 1) % carouselItems.length)
      }, 7500)
      return () => clearInterval(interval)
    }
  }, [media, setSignInProgress])

  const item = carouselItems.at(signInProgress)

  return (
    <View pos="absolute" h={'100%'} w={'100%'} top={0} left={0} mt="auto" mb="auto" zIndex={-1}>
      <Stack mt="auto" mb="auto" w="100%" h="100%">
        {children}
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

const CarouselImage = ({
  image,
  imageBase64,
}: {
  image?: {
    src: string
    height: number
    width: number
  }
  imageBase64?: string
}) => {
  return (
    <View
      pos="absolute"
      h={'100%'}
      w={'100%'}
      top={0}
      left={0}
      mt="auto"
      mb="auto"
      zIndex={-1}
      bc="$background"
    >
      {image?.src && (
        <SolitoImage
          placeholder="blur"
          blurDataURL={imageBase64}
          src={image.src}
          fill={true}
          style={{ objectFit: 'cover' }}
          contentPosition={{ left: '65%' }}
          alt="sign-in-carousel"
        />
      )}
    </View>
  )
}
