import { Container, ScrollView, YStack } from '@my/ui'
import { AuthSideBarWrapper } from 'app/components/sidebar/AuthSideBar'
import { useMemo, useState } from 'react'
import { AuthCarouselContext } from './AuthCarouselContext'
import { SolitoImage } from 'solito/image'
import { type GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'

export function AuthLayout({ children }: { children: React.ReactNode; header?: string }) {
  const [carouselImages, setCarouselImages] = useState<GetPlaiceholderImage[]>([])
  const [carouselProgress, setCarouselProgress] = useState(0)

  const carouselImage = carouselImages[carouselProgress]

  return useMemo(
    () => (
      <AuthCarouselContext.Provider
        value={{ carouselImages, setCarouselImages, carouselProgress, setCarouselProgress }}
      >
        <AuthSideBarWrapper>
          {carouselImage && (
            <SolitoImage
              placeholder="blur"
              blurDataURL={carouselImage.base64}
              src={carouselImage.img.src}
              fill={true}
              style={{ objectFit: 'cover' }}
              alt="sign-in-carousel"
            />
          )}
          <Container>
            <YStack h={'100%'} f={1}>
              <ScrollView f={3} fb={0} jc="center" backgroundColor={'$transparent'}>
                {children}
              </ScrollView>
            </YStack>
          </Container>
        </AuthSideBarWrapper>
      </AuthCarouselContext.Provider>
    ),
    [carouselImage, carouselImages, carouselProgress, children]
  )
}
