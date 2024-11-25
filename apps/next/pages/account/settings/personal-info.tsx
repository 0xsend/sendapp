import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/settings/layout.web'
import { PersonalInfoScreen } from 'app/features/account/settings'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Personal Information</title>
        <meta name="description" content="Personal Information" key="desc" />
      </Head>
      <PersonalInfoScreen />
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
