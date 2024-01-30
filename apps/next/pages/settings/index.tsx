import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/settings/layout.web'
import { GeneralSettingsScreen } from 'app/features/settings/general-screen'
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
    <SettingsLayout isSettingsHome>{children}</SettingsLayout>
  </HomeLayout>
)

export default Page
