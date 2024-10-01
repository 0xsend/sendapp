import type { Database } from '@my/supabase/database.types'
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import { ButtonOption, TopNav } from 'app/components/TopNav'
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
import { useEffect, useState } from 'react'
import { getRemoteAssets } from 'utils/getRemoteAssets'
import type { GetPlaiceholderImage } from 'app/utils/getPlaiceholderImage'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSendAccountBalances } from 'app/utils/useSendAccountBalances'
import { parseUnits } from 'viem'
import { coinsDict } from 'app/data/coins'
import { baseMainnet, usdcAddress } from '@my/wagmi'
import { DepositButton, SendButton } from 'app/features/home/HomeButtons'
import { MobileButtonRow, useScrollToggle } from 'app/components/MobileButtonRow'
import { Stack } from '@my/ui'
const log = debug('app:pages:index')

export const Page: NextPageWithLayout<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  images,
}) => {
  const { session } = useUser()
  const [carouselImages, setCarouselImages] = useState<GetPlaiceholderImage[]>([])
  const [carouselProgress, setCarouselProgress] = useState(0)

  useEffect(() => {
    if (carouselImages.length === 0) setCarouselImages(images)
  }, [carouselImages, images])

  const { isLoading: isLoadingSendAccount } = useSendAccount()
  const { balances, isLoading: isLoadingBalances } = useSendAccountBalances()
  const usdcBalance = balances?.USDC
  const canSend =
    usdcBalance !== undefined &&
    usdcBalance >= parseUnits('.20', coinsDict[usdcAddress[baseMainnet.id]].decimals)

  const { isVisible: isMobileRowVisible, onScroll } = useScrollToggle()

  return (
    <>
      <Head>
        <title>Send | Home</title>
      </Head>
      {session ? (
        <>
          <HomeLayout
            TopNav={<TopNav header="Home" button={ButtonOption.PROFILE} showLogo={true} />}
            onScroll={onScroll}
          >
            <HomeScreen />
          </HomeLayout>
          <MobileButtonRow
            isVisible={isMobileRowVisible}
            isLoading={isLoadingSendAccount && !isLoadingBalances}
          >
            <Stack f={1} w="50%" flexDirection="row-reverse" maw={350}>
              <DepositButton />
            </Stack>
            {canSend && (
              <Stack f={1} w="50%" jc={'center'} maw={350}>
                <SendButton />
              </Stack>
            )}
          </MobileButtonRow>
        </>
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
