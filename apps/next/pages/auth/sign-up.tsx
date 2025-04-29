import { SignUpScreen } from 'app/features/auth/sign-up/screen'
import Head from 'next/head'
import type { NextPageWithLayout } from '../_app'
import { AuthLayout } from 'app/features/auth/layout.web'

export const Page: NextPageWithLayout = () => {
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

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
