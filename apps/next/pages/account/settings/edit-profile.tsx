import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/settings/layout.web'
import { EditProfileScreen } from 'app/features/account/settings/edit-profile'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { ButtonOption, TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Edit Profile</title>
        <meta name="description" content="Edit Profile" key="desc" />
      </Head>
      <EditProfileScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header={'Settings'} button={ButtonOption.SETTINGS} />}>
    <SettingsLayout>{children}</SettingsLayout>
  </HomeLayout>
)

export default Page
