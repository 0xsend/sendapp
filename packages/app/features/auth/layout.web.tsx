import { Anchor, Container, LinearGradient, Stack, Theme, YStack, isWeb, useMedia } from '@my/ui'
import { IconSendLogo } from 'app/components/icons'
import { AnimationLayout } from 'app/components/layout/animation-layout'
import { AuthSideBarWrapper } from 'app/features/auth/components/AuthSideBar'
import type { GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'
import { usePathname } from 'app/utils/usePathname'
import { useMemo, useState } from 'react'
import { SolitoImage } from 'solito/image'
import { useLink } from 'solito/link'
import { AuthCarouselContext } from './AuthCarouselContext'
import { carouselImagePositions } from './components/Carousel'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Container height={'100%'} f={1}>
      <YStack ai="center" f={1} pt="$7" pb="$10">
        <Anchor {...useLink({ href: '/' })} mx="auto" position="absolute" top={'$6'}>
          <Theme inverse={true}>
            <IconSendLogo size={'$6'} color={'$background'} />
          </Theme>
        </Anchor>
        <YStack pb="$10" pt="$14" mt="$10">
          {children}
        </YStack>
      </YStack>
    </Container>
  )
}

export function AuthLayoutOG({
  children,
}: {
  children: React.ReactNode
  header?: string
}) {
  const media = useMedia()
  const pathname = usePathname()
  const isMobileOnboarding = !media.gtMd && pathname.includes('/auth/onboarding')

  const [carouselImages, setCarouselImages] = useState<GetPlaiceholderImage[]>([])
  const [carouselProgress, setCarouselProgress] = useState(0)

  const carouselImage = carouselImages[carouselProgress]
  const mobileImagePosition = carouselImagePositions[carouselProgress]

  return useMemo(
    () => (
      <AuthCarouselContext.Provider
        value={{
          carouselImages,
          setCarouselImages,
          carouselProgress,
          setCarouselProgress,
        }}
      >
        <AuthSideBarWrapper>
          {carouselImage && !isMobileOnboarding && (
            <Stack
              pos="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              height={isWeb ? '100vh' : '100%'}
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
                    alt="sign-in-carousel"
                  />
                  <LinearGradient
                    pos="absolute"
                    w="100%"
                    h="100%"
                    locations={media.gtMd ? [0.5, 1] : [0, 0.5, 1]}
                    colors={
                      media.gtMd ? ['transparent', 'black'] : ['$black', 'transparent', '$black']
                    }
                  />
                </Stack>
              </AnimationLayout>
            </Stack>
          )}

          <Container height={isWeb ? 'calc(100vh - (100vh - 100%))' : '100%'} $sm={{ px: '$4' }}>
            <YStack h={'100%'} f={1}>
              {children}
            </YStack>
          </Container>
        </AuthSideBarWrapper>
      </AuthCarouselContext.Provider>
    ),
    [
      carouselImage,
      carouselImages,
      carouselProgress,
      children,
      media.gtMd,
      isMobileOnboarding,
      mobileImagePosition,
    ]
  )
}
