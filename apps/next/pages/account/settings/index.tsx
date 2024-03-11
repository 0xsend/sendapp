import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/layout.web'
import { GeneralSettingsScreen } from 'app/features/account/general-screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Settings</title>
        <meta name="description" content="Settings" key="desc" />
      </Head>
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = (children) => (
  <HomeLayout header="Settings" backButton>
    <SettingsLayout>{children}</SettingsLayout>
  </HomeLayout>
)

export default Page
