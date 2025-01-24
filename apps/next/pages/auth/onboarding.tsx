import { OnboardingScreen } from 'app/features/auth/onboarding/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { AuthLayout } from 'app/features/auth/layout.web'
import type { InferGetServerSidePropsType } from 'next'

export const Page: NextPageWithLayout<InferGetServerSidePropsType<typeof getServerSideProps>> =
  () => {
    return (
      <>
        <Head>
          <title>Send | Onboarding</title>
        </Head>
        <OnboardingScreen />
      </>
    )
  }

export const getServerSideProps = userProtectedGetSSP(async () => {
  return { props: {} }
})

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
