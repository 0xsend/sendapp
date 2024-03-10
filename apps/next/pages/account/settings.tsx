import { HomeLayout } from 'app/features/home/layout.web'
import { AccountLayout } from 'app/features/account/layout.web'
import { GeneralSettingsScreen } from 'app/features/account/general-screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Settings</title>
        <meta
          name="description"
          content="Send Tags simplify transactions by replacing long wallet addresses with memorable identifiers."
          key="desc"
        />
      </Head>
      <GeneralSettingsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = (children) => (
  <HomeLayout>
    <AccountLayout isAccountHome>{children}</AccountLayout>
  </HomeLayout>
)

export default Page
