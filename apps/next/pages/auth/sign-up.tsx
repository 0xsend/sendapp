import { SignUpScreen } from 'app/features/auth/sign-up/screen'
import Head from 'next/head'
import { guestOnlyGetSSP } from 'utils/guestOnly'
import type { NextPageWithLayout } from '../_app'
import { AuthLayout } from 'app/features/auth/layout.web'
import type { InferGetServerSidePropsType } from 'next'
import { getRemoteAssets } from 'utils/getRemoteAssets'
import { useContext, useEffect } from 'react'
import { AuthCarouselContext } from 'app/features/auth/AuthCarouselContext'

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
        <title>Send | Sign Up</title>
        <meta name="description" content="Future Cash. Sign up for Send." key="desc" />
      </Head>
      <SignUpScreen />
    </>
  )
}

export const getServerSideProps = guestOnlyGetSSP(async () => {
  const paths = [
    'app_images/auth_image_3.jpg',
    'app_images/auth_image_1.jpg',
    'app_images/auth_image_2.jpg',
  ]
  const images = await getRemoteAssets(paths)
  return { props: { images } }
})

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
