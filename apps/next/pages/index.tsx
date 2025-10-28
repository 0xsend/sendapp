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
    description: 'Peer-to-peer money. Send. Save. Invest.',
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
      fetch('/api/carousel-images')
        .then((res) => res.json())
        .then((data) => {
          if (data.images) {
            setCarouselImages(data.images)
          }
        })
        .catch((error) => {
          console.error('Failed to load carousel images:', error)
          setCarouselImages([])
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
