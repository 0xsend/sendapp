import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { AuthLayout } from 'app/features/auth/layout.web'
import { LoginWithPhoneScreen } from 'app/features/auth/loginWithPhone/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Login With Phone" />
      <LoginWithPhoneScreen />
    </>
  )
}

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
