import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/settings/layout.web'
import { EditProfileScreen } from 'app/features/account/settings/edit-profile'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../../_app'
import { AccountTopNav } from 'app/features/account/AccountTopNav'

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
  <HomeLayout header={'Settings'} subheader={'Edit Profile'} TopNav={AccountTopNav}>
    <SettingsLayout>{children}</SettingsLayout>
  </HomeLayout>
)

export default Page
