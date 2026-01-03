import { TopNav } from 'app/components/TopNav'
import { HomeLayout } from 'app/features/home/layout.web'
import { HomeScreen } from 'app/features/home/screen'
import { SplashScreen } from 'app/features/splash/screen'
import { useUser } from 'app/utils/useUser'
import { NextSeo } from 'next-seo'
import { buildSeo } from 'utils/seo'
import type { NextPageWithLayout } from './_app'
import { AuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { useCallback, useEffect, useState } from 'react'
import type { GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'
import { useQueryClient } from '@tanstack/react-query'
import { SSheet as Sheet } from '@my/ui'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { useAuthScreenParams } from 'app/routers/params'
import { useSetReferralCode } from 'app/utils/useReferralCode'

if (typeof global === 'undefined') {
  window.global = window
}

export const Page: NextPageWithLayout = () => {
  const { session, isLoading } = useUser()
  const [carouselImages, setCarouselImages] = useState<GetPlaiceholderImage[]>([])
  const [carouselProgress, setCarouselProgress] = useState(0)
  const queryClient = useQueryClient()
  const [{ referral }] = useAuthScreenParams()
  const { mutateAsync: setReferralCodeMutateAsync } = useSetReferralCode()

  const siteUrl = process.env.NEXT_PUBLIC_URL || 'https://send.app'
  const seo = buildSeo({
    title: 'Send',
    description:
      'Send money, earn up to 10% yield, invest, and collect rewards with every transaction - no banks required. start sending.',
    url: siteUrl,
    type: 'website',
  })

  const cancelAndRemoveAccountsQueries = useCallback(async () => {
    if (!session) {
      const options = { queryKey: [useSendAccount.queryKey] }
      await queryClient.cancelQueries(options)
      queryClient.removeQueries(options)
      queryClient.clear()
    }
  }, [session, queryClient])

  useEffect(() => {
    if (!session && carouselImages.length === 0) {
      // Omit credentials to ensure CDN caching works (like CoinGecko endpoints)
      fetch('/api/carousel-images', { credentials: 'omit' })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`Failed to fetch: ${res.status}`)
          }
          return res.json()
        })
        .then((data) => {
          if (data.images && Array.isArray(data.images) && data.images.length > 0) {
            // Filter out any null images and ensure base64 is present
            const validImages = data.images.filter(
              (img: GetPlaiceholderImage) => img !== null && img?.base64 !== undefined
            )
            if (validImages.length > 0) {
              console.log('[Carousel] Loaded images with blur data:', validImages.length)
              setCarouselImages(validImages)
            } else {
              console.warn('[Carousel] No valid images with blur data found')
            }
          }
        })
        .catch((error) => {
          console.error('[Carousel] Failed to load carousel images:', error)
          // Don't set empty array - keep it empty so we can retry or show a fallback
        })
    }
  }, [session, carouselImages.length])

  useEffect(() => {
    if (referral) {
      void setReferralCodeMutateAsync(referral)
    }
  }, [referral, setReferralCodeMutateAsync])

  useEffect(() => {
    void cancelAndRemoveAccountsQueries()
  }, [cancelAndRemoveAccountsQueries])

  return (
    <>
      <NextSeo {...seo} />
      {session ? (
        <Sheet.SheetIosBackgroundScale>
          <HomeLayout TopNav={<TopNav header="Home" showLogo={true} backFunction="home" />}>
            <SendEarnProvider>
              <HomeScreen />
            </SendEarnProvider>
          </HomeLayout>
        </Sheet.SheetIosBackgroundScale>
      ) : (
        <AuthCarouselContext.Provider
          value={{
            carouselImages,
            setCarouselImages,
            carouselProgress,
            setCarouselProgress,
          }}
        >
          <SplashScreen hidden={isLoading} />
        </AuthCarouselContext.Provider>
      )}
    </>
  )
}

export default Page
