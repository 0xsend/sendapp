import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsScreen } from 'app/features/settings/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Setting</title>
        <meta
          name="description"
          content="Send Tags simplify transactions by replacing long wallet addresses with memorable identifiers."
          key="desc"
        />
      </Head>
      <SettingsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = (children) => <HomeLayout>{children}</HomeLayout>

export default Page
