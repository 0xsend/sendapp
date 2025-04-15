import { Paragraph, YStack } from '@my/ui'
import { useQueryClient } from '@tanstack/react-query'
import { AuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { HomeScreen } from 'app/features/home/screen'
import { SplashScreen } from 'app/features/splash/screen'
import type { GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { useUser } from 'app/utils/useUser'
import { Stack } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

// Hardcoded carousel images for mobile - using type assertion to avoid complexities with GetPlaiceholderImage type
const mobileCarouselImages = [
  {
    img: {
      src: 'https://supabase.send.it/storage/v1/object/public/send-public/app_images/auth_image_3.jpg',
      height: 1080,
      width: 1920,
    },
    base64: '',
    color: [0, 0, 0],
    pixels: [],
    css: '',
    svg: '',
  },
  {
    img: {
      src: 'https://supabase.send.it/storage/v1/object/public/send-public/app_images/auth_image_2.jpg',
      height: 1080,
      width: 1920,
    },
    base64: '',
    color: [0, 0, 0],
    pixels: [],
    css: '',
    svg: '',
  },
  {
    img: {
      src: 'https://supabase.send.it/storage/v1/object/public/send-public/app_images/auth_image_1.jpg',
      height: 1080,
      width: 1920,
    },
    base64: '',
    color: [0, 0, 0],
    pixels: [],
    css: '',
    svg: '',
  },
] as GetPlaiceholderImage[]

export default function Screen() {
  const { session } = useUser()
  const [carouselImages, setCarouselImages] = useState<GetPlaiceholderImage[]>([])
  const [carouselProgress, setCarouselProgress] = useState(0)
  const queryClient = useQueryClient()

  const cancelAndRemoveAccountsQueries = useCallback(async () => {
    if (!session) {
      const options = { queryKey: [useSendAccount.queryKey] }
      await queryClient.cancelQueries(options)
      queryClient.removeQueries(options)
    }
  }, [session, queryClient])

  useEffect(() => {
    if (carouselImages.length === 0) setCarouselImages(mobileCarouselImages)
  }, [carouselImages])

  useEffect(() => {
    void cancelAndRemoveAccountsQueries()
  }, [cancelAndRemoveAccountsQueries])

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />

      {session ? (
        <YStack f={1}>
          <HomeScreen />
        </YStack>
      ) : (
        <AuthCarouselContext.Provider
          value={{
            carouselImages,
            setCarouselImages,
            carouselProgress,
            setCarouselProgress,
          }}
        >
          <YStack flex={1} jc="center" ai="center" f={1} height={'100%'} w={'100%'} bc="$red9Light">
            <Paragraph>hello too asdfa sdfasfasdsda</Paragraph>
          </YStack>
          {/* <SplashScreen /> */}
        </AuthCarouselContext.Provider>
      )}
    </>
  )
}
