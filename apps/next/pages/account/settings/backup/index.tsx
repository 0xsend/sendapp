import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/settings/layout.web'
import { BackupScreen } from 'app/features/account/settings'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Backup</title>
        <meta name="description" content="Backup Send Account" key="desc" />
      </Head>
      <BackupScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Settings" backFunction={'pop'} />} fullHeight>
    <SettingsLayout>{children}</SettingsLayout>
  </HomeLayout>
)

export default Page
