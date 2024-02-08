import {
  Container,
  Stack,
  View,
  YStack,
  CornerTriangle,
  Button,
  ButtonText,
  Theme,
  XStack,
  useMedia,
  Text,
  useWindowDimensions,
  Image,
} from '@my/ui'
import { IconSLogo, IconSendLogoGreenSlash } from 'app/components/icons'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import { SignInForm } from './sign-in-form'
import { AnimationLayout } from 'app/components/layout/animation-layout'

const screens = ['instant-payments', 'qrcode-payments', 'realtime-payments', 'sign-in-form']

export const SignInScreen = () => {
  const { height: windowHeight } = useWindowDimensions()
  const [signInProgress, setSignInProgress] = useState(0)
  const media = useMedia()

  const incrementProgress = () => {
    setSignInProgress((i) => (i + 1) % carouselComponents.length)
  }

  const decrementProgress = () => {
    setSignInProgress((i) => (i - 1 + carouselComponents.length) % carouselComponents.length)
  }

  const getSignInPage = (page: string | undefined) => {
    switch (true) {
      case page === 'instant-payments':
        return (
          <>
            <SignInCarousel signInProgress={0} />
            <ContinueButton incrementProgress={incrementProgress} />
          </>
        )
      case page === 'qrcode-payments':
        return (
          <>
            <SignInCarousel signInProgress={1} />
            <ContinueButton incrementProgress={incrementProgress} />
          </>
        )
      case page === 'realtime-payments':
        return (
          <>
            <SignInCarousel signInProgress={2} />
            <SignInButtons setSignInProgress={setSignInProgress} />
          </>
        )
      case page === 'sign-in-form':
        return <SignInForm />
      default:
        return <SignInCarousel signInProgress={0} />
    }
  }

  return (
    <Container>
      <YStack w="100%" h={windowHeight * 0.95} jc="space-around" mb="auto" mt="auto">
        {media.gtMd ? (
          <SignInCarousel signInProgress={signInProgress} setSignInProgress={setSignInProgress} />
        ) : (
          <AnimationLayout currentKey={screens[signInProgress] || 'none'} direction={1}>
            <Stack f={1} h="25%" py="$5" jc="flex-end" ai="center" $gtMd={{ dsp: 'none' }}>
              <Theme inverse={true}>
                <IconSendLogoGreenSlash size={'$10'} color="$background" />
              </Theme>
            </Stack>

            {getSignInPage(screens[signInProgress])}
          </AnimationLayout>
        )}
      </YStack>
    </Container>
  )
}

const ContinueButton = ({ incrementProgress }: { incrementProgress: () => void }) => (
  <XStack f={1} w="100%" jc="center" $gtMd={{ dsp: 'none' }} py="$5" gap="$2">
    <Button f={1} onPress={incrementProgress}>
      <ButtonText fontWeight={'bold'}>Continue</ButtonText>
    </Button>
  </XStack>
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

const carouselComponents = [
  {
    uri: 'https://raw.githubusercontent.com/0xsend/assets/main/app_images/instant-payments.jpg',
    line1: 'LIKE CASH',
    description: 'SEND AND RECEIVE MONEY GLOBALLY IN SECONDS',
  },
  {
    uri: 'https://raw.githubusercontent.com/0xsend/assets/main/app_images/qrcode-payments.jpg',

    line1: 'ALL YOURS',
    description: 'ONLY YOU HAVE ACCESS TO YOUR FUNDS',
  },
  {
    uri: 'https://raw.githubusercontent.com/0xsend/assets/main/app_images/realtime-payments.jpg',
    line1: 'SECURE',
    description: 'PRIVACY FIRST WITH VERIFIED SIGN-IN AND TRANSACTIONS',
  },
]

const SignInCarousel = ({
  signInProgress = 0,
  setSignInProgress,
}: {
  signInProgress: number
  setSignInProgress?: Dispatch<SetStateAction<number>> | undefined
}) => {
  const media = useMedia()
  const [layoutHeight, setLayoutHeight] = useState(0)

  useEffect(() => {
    if (media.gtMd) {
      const interval = setInterval(() => {
        setSignInProgress?.((progress) => (progress + 1) % carouselComponents.length)
      }, 7500)
      return () => clearInterval(interval)
    }
  }, [media, setSignInProgress])

  const carouselComponent = carouselComponents.at(signInProgress)

  return (
    <Stack
      pos="relative"
      h="100%"
      f={1}
      ai="center"
      jc="center"
      onLayout={(event) => {
        setLayoutHeight(event.nativeEvent.layout.height)
      }}
    >
      <View pos="absolute" top={0} left={0} mt="auto" mb="auto" zIndex={-1} w="100%" h="100%">
        <Stack mt="auto" mb="auto" w="100%" h="100%" zIndex={1}>
          <CornerTriangle corner="topLeft" pos="absolute" top={0} left={0} btw={273} brw={90} />
          <YStack pos="absolute" bottom={'5%'} left={'5%'}>
            <Text fontSize="$8" $gtXs={{ fontSize: '$13' }} fontWeight={'bold'} color="$white">
              {carouselComponent?.line1}
            </Text>
            <Text
              fontSize="$2"
              $gtXs={{ fontSize: '$8', maw: '55%' }}
              fontWeight={'normal'}
              maw="70%"
              color="$green5Light"
            >
              {carouselComponent?.description}
            </Text>
          </YStack>
          <CornerTriangle
            corner="bottomRight"
            pos="absolute"
            bottom={0}
            right={0}
            btw={273}
            brw={90}
          />
          <Image
            width="100%"
            height="100%"
            source={{
              height: layoutHeight,
              uri: carouselComponent?.uri,
            }}
            style={{ borderRadius: 33, zIndex: -1 }}
          />
          <View
            position="absolute"
            bottom={'$0'}
            right={'$0'}
            dsp="none"
            $gtMd={{ dsp: 'inherit' }}
          >
            <IconSLogo size={'$4'} />
          </View>
        </Stack>
      </View>
    </Stack>
  )
}
