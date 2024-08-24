import {
  Button,
  H1,
  LinearGradient,
  Paragraph,
  Stack,
  XStack,
  YStack,
  isWeb,
  useMedia,
  usePwa,
  useSafeAreaInsets,
} from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { useAuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { Carousel, carouselImagePositions } from 'app/features/auth/components/Carousel'
import { SolitoImage } from 'solito/image'
import { useLink } from 'solito/link'
import { AnimationLayout } from '../../components/layout/animation-layout'
import { useState } from 'react'
import { SignInButton } from '../auth/components/SignInButton'

export const formatErrorMessage = (error: Error) => {
  if (error.message.startsWith('The operation either timed out or was not allowed')) {
    return 'Passkey Authentication Failed'
  }
  return error.message
}

export function SplashScreen() {
  return (
    <XStack
      h={isWeb ? '100svh' : '100%'}
      justifyContent={'space-between'}
      mx={'auto'}
      maxWidth={'1600px'}
      w={'100%'}
    >
      {/* Top section with carousel */}

      <YStack
        flex={1}
        p={'$size.6'}
        justifyContent="space-between"
        display="none"
        $gtMd={{ display: 'flex' }}
        flexShrink={0}
      >
        <IconSendLogo size="$4" color="$white" $gtMd={{ color: '$color12' }} />
        <YStack gap={'$size.0.9'}>
          <H1 textTransform={'uppercase'} $gtLg={{ size: '$14' }} size={'$12'} fontWeight={'900'}>
            Welcome
          </H1>
          <H1 textTransform={'uppercase'} $gtLg={{ size: '$14' }} size={'$12'} fontWeight={'900'}>
            to Send
          </H1>
          <Paragraph size={'$6'} color={'$color10'}>
            Sign in with your passkey.
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
  const { sat, sab } = useSafeAreaInsets()

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
      h={containerHeight}
      $gtMd={{ p: '$size.1.5', maxWidth: '720px' }}
      w="100%"
      position="relative"
      f={1}
    >
      <YStack
        h={isPwa && '100vh'}
        pt={isPwa && sat}
        pb={isPwa && sab}
        overflow="hidden"
        $gtMd={{ borderRadius: '$8' }}
        w="100%"
      >
        {carouselImage && (
          <Stack
            pos="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            height={isWeb ? '100dvh' : '100%'}
          >
            <Stack
              bc="$black"
              pos="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              height={isWeb ? '100dvh' : '100%'}
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
                height={isWeb ? '100dvh' : '100%'}
              >
                <SolitoImage
                  placeholder="blur"
                  blurDataURL={carouselImage.base64}
                  src={carouselImage.img.src}
                  fill={true}
                  contentPosition={media.gtMd ? undefined : mobileImagePosition}
                  style={{ objectFit: 'cover' }}
                  alt="splash-screen-carousel"
                />
                <LinearGradient
                  pos="absolute"
                  w="100%"
                  h="100%"
                  locations={media.gtMd ? [0.3, 1] : [0, 0.5, 1]}
                  colors={
                    media.gtMd ? ['transparent', '$black'] : ['$black', 'transparent', '$black']
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
          p="$size.3.5"
          pb={0}
          maw={738}
          mx="auto"
          w="100%"
        >
          <YStack w="100%">
            <YStack jc="flex-end" f={1} gap="$2" pb="$size.7" $gtMd={{ pb: '$size.0.9' }}>
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
            pt="$size.4"
            pb="$size.0.5"
            f={1}
            l={0}
            w="100%"
          >
            <IconSendLogo size="$size.2" color="$white" ml={'$size.3.5'} />
            <AuthButtons />
          </YStack>
        </YStack>
      </YStack>
    </XStack>
  )
}

function AuthButtons() {
  const [signInError, setSignInError] = useState<Error | null>(null)
  const signUpLink = useLink({ href: '/auth/sign-up' })

  return (
    <XStack
      gap={'$size.0.9'}
      pos={'relative'}
      pb={'$size.2'}
      jc="center"
      $gtMd={{ jc: 'flex-start' }}
      w="100%"
      alignSelf="center"
    >
      <SignInButton setError={setSignInError} size="$4" w="$12" />
      <Button {...signUpLink} borderColor="$primary" variant="outlined" size="$4" w="$12">
        <Button.Text color="$white" $gtMd={{ color: '$color12' }}>
          SIGN-UP
        </Button.Text>
      </Button>

      {signInError && (
        <Paragraph pos={'absolute'} color="$error" bottom={0}>
          {formatErrorMessage(signInError)}
        </Paragraph>
      )}
    </XStack>
  )
}
