import { SignInScreen } from 'app/features/auth/sign-in-screen'
import Head from 'next/head'
import { guestOnlyGetSSP } from 'utils/guestOnly'
import { NextPageWithLayout } from './_app'
import { AuthLayout } from 'app/features/auth/layout.web'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Sign In</title>
        <meta
          name="description"
          content="Infrastructure for Merchants and Stablecoin Transactions"
          key="desc"
        />
      </Head>
      <SignInScreen />
    </>
  )
}

export const getServerSideProps = guestOnlyGetSSP()

Page.getLayout = (children) => <AuthLayout>{children}</AuthLayout>

export default Page
