import { OnboardingScreen } from 'app/features/auth/onboarding/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../_app'
import { AuthLayout } from 'app/features/auth/layout.web'
import { useContext, useEffect } from 'react'
import { AuthCarouselContext } from 'app/features/auth/AuthCarouselContext'
import { getRemoteAssets } from 'utils/getRemoteAssets'
import { InferGetServerSidePropsType } from 'next'

export const Page: NextPageWithLayout<InferGetServerSidePropsType<typeof getServerSideProps>> = ({
  images,
}) => {
  const { carouselImages, setCarouselImages } = useContext(AuthCarouselContext)

  useEffect(() => {
    if (carouselImages.length === 0) setCarouselImages(images)
  }, [setCarouselImages, carouselImages, images])

  return (
    <>
      <Head>
        <title>/send | Onboarding</title>
      </Head>
      <OnboardingScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP(async () => {
  const paths = [
    'app_images/auth_image_1.jpg?raw=true',
    'app_images/auth_image_2.jpg?raw=true',
    'app_images/auth_image_3.jpg?raw=true',
  ]
  const images = await getRemoteAssets(paths)
  return { props: { images } }
})

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
