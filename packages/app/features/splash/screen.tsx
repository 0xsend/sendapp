import { YStack, XStack, Text, Button, Anchor, useMedia, Stack, LinearGradient } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { AnimationLayout } from '../../components/layout/animation-layout'
import { SolitoImage } from 'solito/image'
import { useAuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { Carousel, carouselImagePositions } from 'app/features/auth/components/Carousel'
import { useLink } from 'solito/link'
import { isWeb } from '@my/ui'

export function SplashScreen() {
  const media = useMedia()
  const { carouselImages, carouselProgress } = useAuthCarouselContext()
  const carouselImage = carouselImages[carouselProgress]
  const mobileImagePosition = carouselImagePositions[carouselProgress]

  const signInLink = useLink({ href: '/auth/signin' })

  console.log('carouselImages', carouselImages)

  return (
    <YStack f={1} h="100%" overflow="hidden">
      {carouselImage && (
        <Stack
          pos="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          height={isWeb ? '100vh' : '100%'}
          overflow="hidden"
        >
          <Stack
            bc="$black"
            pos="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            height={isWeb ? '100vh' : '100%'}
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
              height={isWeb ? '100vh' : '100%'}
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

      <YStack f={1} jc="space-between" ai="center" p="$4" zi={1}>
        <IconSendLogo size="$8" />

        <YStack ai="center" space="$4">
          <Text fontSize="$8" fontWeight="bold">
            Welcome to Send
          </Text>
          <Text fontSize="$4" ta="center">
            Send and receive money globally in seconds
          </Text>
          <Button {...signInLink} size="$4">
            Sign In
          </Button>
        </YStack>

        <YStack w="100%">
          <Stack w="100%">
            <Carousel fullscreen={false} currentKey={carouselProgress.toString()} />
          </Stack>
          <XStack space="$4" my="$4">
            <Anchor href="/about">About</Anchor>
            <Anchor href="/privacy">Privacy</Anchor>
            <Anchor href="/terms">Terms</Anchor>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  )
}
