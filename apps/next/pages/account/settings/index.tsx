import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/layout.web'
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
  <HomeLayout header="Settings" backLink={'/account'}>
    <SettingsLayout>{children}</SettingsLayout>
  </HomeLayout>
)

export default Page
