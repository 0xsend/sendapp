import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/settings/layout.web'
import { AddPasskeyScreen } from 'app/features/account/settings/backup/add-passkey'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../../_app'
import { ButtonOption, TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Add Passkey</title>
        <meta name="description" content="Backup Send Account Add Passkey" key="desc" />
      </Head>
      <AddPasskeyScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Settings" button={ButtonOption.SETTINGS} />}>
    <SettingsLayout>{children}</SettingsLayout>
  </HomeLayout>
)

export default Page
