import { ScrollView, YStack, useWindowDimensions } from '@my/ui'

import { SignInSideBarWrapper } from 'app/components/sidebar/SignInSideBar'
import { useMemo, useState } from 'react'
import { AuthCarouselContext } from './AuthCarouselContext'
import { SolitoImage } from 'solito/image'
import { type GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'

export function AuthLayout({ children }: { children: React.ReactNode; header?: string }) {
  const [carouselImages, setCarouselImages] = useState<GetPlaiceholderImage[]>([])
  const [carouselProgress, setCarouselProgress] = useState(0)
  const { height: windowHeight } = useWindowDimensions()

  const carouselImage = carouselImages[carouselProgress]

  return useMemo(
    () => (
      <AuthCarouselContext.Provider
        value={{ carouselImages, setCarouselImages, carouselProgress, setCarouselProgress }}
      >
        <SignInSideBarWrapper>
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
          <YStack h={windowHeight} f={1}>
            <ScrollView f={3} fb={0} jc="center" backgroundColor={'$transparent'}>
              {children}
            </ScrollView>
          </YStack>
        </SignInSideBarWrapper>
      </AuthCarouselContext.Provider>
    ),
    [carouselImage, carouselImages, carouselProgress, children, windowHeight]
  )
}
