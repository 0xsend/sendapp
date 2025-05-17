import {
  Button,
  ButtonText,
  H1,
  isWeb,
  LinearGradient,
  Paragraph,
  Stack,
  SubmitButton,
  useMedia,
  usePwa,
  useSafeAreaInsets,
  useToastController,
  XStack,
  YStack,
} from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { useAuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { Carousel, carouselImagePositions } from 'app/features/auth/components/Carousel'
import { useAuthScreenParams } from 'app/routers/params'
import { formatErrorMessage } from 'app/utils/formatErrorMessage'
import { useEffect, useState } from 'react'
import { SolitoImage } from 'solito/image'
import { useLink } from 'solito/link'
import { useRouter } from 'solito/router'
import { AnimationLayout } from '../../components/layout/animation-layout'
import { useSignIn } from 'app/utils/send-accounts'

export function SplashScreen() {
  return (
    <XStack
      flex={1}
      justifyContent={'space-between'}
      mx={'auto'}
      maxWidth={1600}
      w={'100%'}
      $platform-web={{
        height: '100svh',
      }}
    >
      {/* Top section with carousel */}

      <YStack
        flex={1}
        p={'$6'}
        justifyContent="space-between"
        display="none"
        $gtMd={{ display: 'flex' }}
        flexShrink={0}
      >
        <IconSendLogo size="$4" color="$white" $gtMd={{ color: '$color12' }} />
        <YStack gap={'$0.9'}>
          <H1 textTransform={'uppercase'} $gtLg={{ size: '$14' }} size={'$12'} fontWeight={'900'}>
            Welcome
          </H1>
          <H1 textTransform={'uppercase'} $gtLg={{ size: '$14' }} size={'$12'} fontWeight={'900'}>
            to Send
          </H1>
          <Paragraph size={'$6'} color={'$color10'}>
            Sign in with your passkey
          </Paragraph>
        </YStack>
        <AuthButtons />
      </YStack>

      <Hero />

      {/* Additional content sections */}
      {/* <YStack space="$8" p="$4">
          <Section
            title="INSTANT PAYMENTS"
            description="Send to anyone, anywhere, instantly"
            icon={<IconEthereum size="$6" />}
            backgroundColor="$blue10"
          />

          <Section
            title="DEFI INTEGRATION"
            description="Access decentralized finance protocols directly"
            icon={<Check color="white" size={60} />}
            backgroundColor="$purple10"
          />

          <Section
            title="SECURE SMART CONTRACTS"
            description="Leverage Ethereum's smart contract capabilities"
            icon={<Check color="white" size={60} />}
            backgroundColor="$green10"
          />

          <Section
            title="JOIN THE ETHEREUM ECOSYSTEM"
            description="Be part of the future of finance"
            icon={<Check color="white" size={60} />}
            backgroundColor="$yellow10"
          />
        </YStack> */}

      {/* Footer */}
      {/* <XStack jc="center" ai="center" p="$4" space="$4">
          <Anchor href="/about">About</Anchor>
          <Anchor href="/privacy">Privacy</Anchor>
          <Anchor href="/terms">Terms</Anchor>
        </XStack> */}
    </XStack>
  )
}

function Hero() {
  const media = useMedia()
  const { carouselImages, carouselProgress } = useAuthCarouselContext()
  const carouselImage = carouselImages[carouselProgress]
  const mobileImagePosition = carouselImagePositions[carouselProgress]
  const isPwa = usePwa()
  const { bottom, top } = useSafeAreaInsets()

  const containerHeight = (() => {
    switch (true) {
      case isPwa:
        return '100vh'
      case isWeb:
        return '100dvh'
      default:
        return '100%'
    }
  })()

  return (
    <XStack
      $gtMd={{ p: '$1.5', maxWidth: 720 }}
      position="relative"
      f={1}
      $platform-web={{
        height: containerHeight,
      }}
    >
      <YStack
        pt={Math.max(top, 24)}
        pb={Math.max(bottom, 16)}
        overflow="hidden"
        $gtMd={{ borderRadius: '$8' }}
        f={1}
      >
        {carouselImage && (
          <Stack
            pos="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            $platform-web={{
              height: '100dvh',
            }}
          >
            <Stack
              bc="$black"
              pos="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              $platform-web={{
                height: '100dvh',
              }}
            />
            <AnimationLayout
              currentKey={carouselImage.base64 || 'none'}
              direction={1}
              fullscreen={true}
            >
              <Stack
                pos="absolute"
                top={0}
                left={0}
                right={0}
                bottom={0}
                $platform-web={{
                  height: '100dvh',
                }}
              >
                <SolitoImage
                  placeholder="blur"
                  blurDataURL={carouselImage.base64}
                  src={carouselImage.img.src}
                  fill={true}
                  contentPosition={media.gtMd ? undefined : mobileImagePosition}
                  resizeMode="cover"
                  alt="splash-screen-carousel"
                />
                <LinearGradient
                  pos="absolute"
                  w="100%"
                  h="100%"
                  locations={media.gtMd ? [0.3, 1] : [0, 0.5, 1]}
                  colors={
                    media.gtMd
                      ? ['rgba(0,0,0,0)', 'rgba(0,0,0,1)']
                      : ['rgba(0,0,0,1)', 'rgba(0,0,0,0)', 'rgba(0,0,0,1)']
                  }
                />
              </Stack>
            </AnimationLayout>
          </Stack>
        )}

        <YStack
          f={1}
          display="flex"
          fd="column"
          jc="flex-end"
          w={'100%'}
          mx="auto"
          $gtSm={{ maw: 738 }}
        >
          <YStack f={1}>
            <YStack jc="flex-end" f={1} gap="$2" pb="$12" $gtMd={{ pb: '$0.9' }} px={'$8'}>
              <Carousel currentKey={carouselProgress.toString()} fullscreen={false} />
            </YStack>
            {/* <XStack gap="$4" ai="center" jc="center">
              <SignInButton display={media.gtMd ? 'none' : 'flex'} />
              <Anchor color="$white" href="https://info.send.it">
                About
              </Anchor>
              <Anchor color="$white" href="https://info.send.it/legal/privacy-policy">
                Privacy
              </Anchor>
              <Anchor color="$white" href="https://info.send.it/legal/terms-of-service">
                Terms
              </Anchor>
            </XStack> */}
          </YStack>
          <YStack
            pos="absolute"
            height={'100%'}
            jc="space-between"
            $gtMd={{ display: 'none' }}
            ai="flex-start"
            px={'$8'}
            pt={'$8'}
            f={1}
            l={0}
            $platform-web={{
              width: '100%',
            }}
          >
            <IconSendLogo size="$3" color="$white" />
            <AuthButtons />
          </YStack>
        </YStack>
      </YStack>
    </XStack>
  )
}

function AuthButtons() {
  const [queryParams] = useAuthScreenParams()
  const { redirectUri } = queryParams
  const toast = useToastController()
  const router = useRouter()
  const signUpLink = useLink({ href: '/auth/sign-up' })
  const [isSigningIn, setIsSigningIn] = useState(false)
  const { mutateAsync: signInMutateAsync } = useSignIn()

  const handleSignIn = async () => {
    setIsSigningIn(true)
    try {
      await signInMutateAsync({})
      router.push(redirectUri ?? '/')
    } catch (error) {
      toast.show(formatErrorMessage(error), {
        preset: 'error',
        isUrgent: true,
        duration: 10000000,
      })
    } finally {
      setIsSigningIn(false)
    }
  }

  useEffect(() => () => toast.hide(), [toast])

  return (
    <XStack
      gap={'$3.5'}
      pos={'relative'}
      pb={'$5'}
      jc="center"
      $gtMd={{ jc: 'flex-start' }}
      alignSelf="center"
      width="100%"
    >
      <Button
        {...signUpLink}
        f={1}
        flexBasis={0}
        borderColor="$primary"
        variant="outlined"
        br={'$4'}
        p={0}
        $gtLg={{ w: '$13', f: 0 }}
      >
        <Button.Text color="$white" size="$5" lineHeight={16} $gtMd={{ color: '$color12' }}>
          SIGN UP
        </Button.Text>
      </Button>
      <SubmitButton
        f={1}
        flexBasis={0}
        p={0}
        onPress={handleSignIn}
        disabled={isSigningIn}
        br={'$4'}
        $gtLg={{ w: '$13', f: 0 }}
      >
        <ButtonText size="$5" color={'$black'} lineHeight={16}>
          {isSigningIn ? 'SIGNING IN...' : 'SIGN IN'}
        </ButtonText>
      </SubmitButton>
    </XStack>
  )
}
