import { Container, YStack, LinearGradient, useMedia } from '@my/ui'
import { AuthSideBarWrapper } from 'app/components/sidebar/AuthSideBar'
import { useMemo, useState } from 'react'
import { AuthCarouselContext } from './AuthCarouselContext'
import { SolitoImage } from 'solito/image'
import { type GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'
import { usePathname } from 'app/utils/usePathname'
import { AnimationLayout } from '../../components/layout/animation-layout'
import { carouselImagePositions } from './components/Carousel'

export function AuthLayout({
  children,
}: {
  children: React.ReactNode
  header?: string
}) {
  const media = useMedia()
  const pathname = usePathname()
  const isMobileOnboarding = media.sm && pathname.includes('/auth/onboarding')

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
            <AnimationLayout
              currentKey={carouselImage.base64 || 'none'}
              direction={1}
              fullscreen={true}
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
                colors={media.gtMd ? ['transparent', 'black'] : ['$black', 'transparent', '$black']}
              />
            </AnimationLayout>
          )}

          <Container height={'100%'}>
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
