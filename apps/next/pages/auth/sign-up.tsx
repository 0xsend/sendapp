import { SignUpScreen } from 'app/features/auth/sign-up/screen'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { AuthLayout } from 'app/features/auth/layout.web'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Sign Up" description="Future Cash. Sign up for Send." />
      <SignUpScreen />
    </>
  )
}

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
