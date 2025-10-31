import { useUser } from 'app/utils/useUser'
import { Redirect, Stack, useFocusEffect } from 'expo-router'
import { Container, YStack } from '@my/ui'
import { SplashScreen } from 'app/features/splash/screen'
import { AuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { useCallback, useState } from 'react'
import type { GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'
import { useQueryClient } from '@tanstack/react-query'
import * as NavigationBar from 'expo-navigation-bar'

// Hardcoded carousel images for mobile
const mobileCarouselImages = [
  {
    img: {
      src: require('../assets/images/auth_image_3.jpg'),
    },
  },
  {
    img: {
      src: require('../assets/images/auth_image_2.jpg'),
    },
  },
  {
    img: {
      src: require('../assets/images/auth_image_1.jpg'),
    },
  },
] as unknown as GetPlaiceholderImage[]

export default function Index() {
  const { session } = useUser()
  const [carouselImages, setCarouselImages] = useState<GetPlaiceholderImage[]>(mobileCarouselImages)
  const [carouselProgress, setCarouselProgress] = useState(0)
  const queryClient = useQueryClient()

  useFocusEffect(
    useCallback(() => {
      queryClient.clear()
      setTimeout(() => {
        void NavigationBar.setBackgroundColorAsync('#000000')
      }, 0)
    }, [queryClient])
  )

  // If user is logged in, redirect to the home screen inside the tabs layout
  if (session) {
    return <Redirect href="/(tabs)/home" />
  }

  // If user is not logged in, show the splash screen
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <AuthCarouselContext.Provider
        value={{
          carouselImages,
          setCarouselImages,
          carouselProgress,
          setCarouselProgress,
        }}
      >
        <Container
          safeAreaProps={{
            edges: ['left', 'right', 'bottom'],
            style: { flex: 1, backgroundColor: 'black' },
          }}
          flex={1}
          backgroundColor="black"
          px="$0"
        >
          <YStack flex={1} jc="center" ai="center" f={1} backgroundColor="black">
            <SplashScreen hidden={false} />
          </YStack>
        </Container>
      </AuthCarouselContext.Provider>
    </>
  )
}
