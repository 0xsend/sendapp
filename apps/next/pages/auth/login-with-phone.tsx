import Head from 'next/head'
import type { NextPageWithLayout } from '../_app'
import { AuthLayout } from 'app/features/auth/layout.web'
import { LoginWithPhoneScreen } from 'app/features/auth/loginWithPhone/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Login With Phone</title>
      </Head>
      <LoginWithPhoneScreen />
    </>
  )
}

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
