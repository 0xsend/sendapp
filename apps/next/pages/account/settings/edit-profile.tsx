import { HomeLayout } from 'app/features/home/layout.web'
import { SettingsLayout } from 'app/features/account/layout.web'
import { EditProfileScreen } from 'app/features/account/settings/edit-profile'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../../_app'

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
  <HomeLayout header={'Settings/Edit Profile'} backLink={'/account'}>
    <SettingsLayout>{children}</SettingsLayout>
  </HomeLayout>
)

export default Page
