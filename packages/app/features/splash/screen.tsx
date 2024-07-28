import {
  Anchor,
  Button,
  Container,
  LinearGradient,
  Stack,
  XStack,
  YStack,
  isWeb,
  useMedia,
  usePwa,
  useSafeAreaInsets,
  type ButtonProps,
} from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { useAuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { Carousel, carouselImagePositions } from 'app/features/auth/components/Carousel'
import { SolitoImage } from 'solito/image'
import { useLink } from 'solito/link'
import { AnimationLayout } from '../../components/layout/animation-layout'

export function SplashScreen() {
  return (
    <YStack h={isWeb ? '100svh' : '100%'} bc={'$black'}>
      {/* Top section with carousel */}
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
    </YStack>
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
    <YStack h={containerHeight} pt={isPwa && sat} pb={isPwa && sab} bc="$black" overflow="hidden">
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
                locations={media.gtMd ? [0.5, 1] : [0, 0.5, 1]}
                colors={media.gtMd ? ['transparent', 'black'] : ['$black', 'transparent', '$black']}
              />
              <LinearGradient
                pos="absolute"
                w="100%"
                h="100%"
                locations={[0, 0.5, 1]}
                colors={['$black', 'transparent', '$black']}
              />
            </Stack>
          </AnimationLayout>
        </Stack>
      )}

      <Container
        f={1}
        display="flex"
        fd="column"
        jc="space-between"
        ai="center"
        px="$4"
        pt="$4"
        safeAreaPadding={isPwa && 'y'}
        pb="$6"
      >
        <XStack ai="center" gap="$4" w="100%" mt="$4">
          <IconSendLogo size="$4" mx="auto" color="$white" />
          <SignInButton position="absolute" right={'$6'} display={media.gtMd ? 'flex' : 'none'} />
        </XStack>

        <YStack w="100%">
          <YStack jc="flex-end" f={1} gap="$2" $gtMd={{ pb: '$8' }} ml="auto" w="100%" maw={738}>
            <Carousel currentKey={carouselProgress.toString()} fullscreen={false} />
          </YStack>
          <XStack gap="$4" ai="center" jc="center">
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
          </XStack>
        </YStack>
      </Container>
    </YStack>
  )
}

function SignInButton(props: ButtonProps) {
  const signInLink = useLink({ href: '/auth/sign-in' })
  return (
    <Button {...signInLink} size="$4" theme="green" w="$12" {...props}>
      /SIGN IN
    </Button>
  )
}
