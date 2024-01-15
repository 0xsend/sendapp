import { OnboardingScreen } from 'app/features/onboarding/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from './_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Onboarding</title>
      </Head>
      <OnboardingScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
export default Page
