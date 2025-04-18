import type { Database } from '@my/supabase/database.types'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { TopNav } from 'app/components/TopNav'
import { HomeLayout } from 'app/features/home/layout.web'
import { HomeScreen } from 'app/features/home/screen'
import { SplashScreen } from 'app/features/splash/screen'
import { useUser } from 'app/utils/useUser'
import debug from 'debug'
import type { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import Head from 'next/head'
import { userOnboarded } from 'utils/userOnboarded'
import type { NextPageWithLayout } from './_app'
import { AuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { useCallback, useEffect, useState } from 'react'
import { getRemoteAssets } from 'utils/getRemoteAssets'
import type { GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'
import { useQueryClient } from '@tanstack/react-query'
import { useSendAccount } from 'app/utils/send-accounts/useSendAccounts'
import { MobileButtonRowLayout } from 'app/components/MobileButtonRowLayout'

const log = debug('app:pages:index')

export const Page: NextPageWithLayout<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  images,
}) => {
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
    if (carouselImages.length === 0) setCarouselImages(images)
  }, [carouselImages, images])

  useEffect(() => {
    void cancelAndRemoveAccountsQueries()
  }, [cancelAndRemoveAccountsQueries])

  return (
    <>
      <Head>
        <title>Send</title>
      </Head>
      {session ? (
        <MobileButtonRowLayout.Home>
          <HomeLayout TopNav={<TopNav header="Home" showLogo={true} />}>
            <HomeScreen />
          </HomeLayout>
        </MobileButtonRowLayout.Home>
      ) : (
        <AuthCarouselContext.Provider
          value={{
            carouselImages,
            setCarouselImages,
            carouselProgress,
            setCarouselProgress,
          }}
        >
          <SplashScreen />
        </AuthCarouselContext.Provider>
      )}
    </>
  )
}
export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  setReferralCodeCookie(ctx)
  log('connecting to supabase', process.env.NEXT_PUBLIC_SUPABASE_URL)
  const supabase = createPagesServerClient<Database>(ctx)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    log('no session')
    const paths = [
      'app_images/auth_image_3.jpg',
      'app_images/auth_image_2.jpg',
      'app_images/auth_image_1.jpg',
    ]
    const images = await getRemoteAssets(paths)
    return {
      props: {
        images,
      },
    }
  }

  const needsOnboarding = await userOnboarded(supabase, ctx)
  if (needsOnboarding) return needsOnboarding

  return {
    props: {
      initialSession: session,
      images: [],
    },
  }
}

function setReferralCodeCookie(context: GetServerSidePropsContext) {
  // Read the 'code' query parameter from the request URL
  const referralCode = context.query.referral

  // Set the cookie on the client side if the referral code exists
  if (referralCode) {
    context.res.setHeader(
      'Set-Cookie',
      `referral=${referralCode}; Max-Age=${30 * 24 * 60 * 60}; Path=/;` // 30 days
    )
  }
}

export default Page
