import { SignInScreen } from 'app/features/auth/sign-in-screen'
import Head from 'next/head'
import { guestOnlyGetSSP } from 'utils/guestOnly'
import { NextPageWithLayout } from './_app'
import { SignInSideBarWrapper } from 'app/components/sidebar/SignInSideBar'
import { ScrollView } from '@my/ui'

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
      <SignInSideBarWrapper>
        <ScrollView f={3} fb={0} backgroundColor={'$backgroundHover'}>
          <SignInScreen />
        </ScrollView>
      </SignInSideBarWrapper>
    </>
  )
}

export const getServerSideProps = guestOnlyGetSSP()

export default Page
