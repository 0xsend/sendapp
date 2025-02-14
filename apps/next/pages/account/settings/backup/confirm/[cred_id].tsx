import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/settings/layout.web'
import { ConfirmPasskeyScreen } from 'app/features/account/settings/backup/confirm'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../../../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Confirm Passkey</title>
      </Head>
      <ConfirmPasskeyScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Settings" backFunction={'router'} />} fullHeight>
    <SettingsLayout>{children}</SettingsLayout>
  </HomeLayout>
)

export default Page
