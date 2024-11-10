import { TopNav } from 'app/components/TopNav'
import { CreatePasskeyScreen } from 'app/features/account/settings/backup/create'
import { SettingsLayout } from 'app/features/account/settings/layout.web'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Create Passkey</title>
      </Head>
      <CreatePasskeyScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Settings" />}>
    <SettingsLayout>{children}</SettingsLayout>
  </HomeLayout>
)

export default Page
