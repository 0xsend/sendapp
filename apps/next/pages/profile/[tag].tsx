import { ProfileScreen } from 'app/features/profile/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import { NextPageWithLayout } from '../_app'

export const Page: NextPageWithLayout = () => {
  // TODO: implement getServerSideProps for looking up user profile by tag
  // https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props
  return (
    <>
      <Head>
        <title>Send | Profile</title>
      </Head>
      <ProfileScreen />
    </>
  )
}

export const getServerSideProps =
  userProtectedGetSSP(
    // TODO: implement getServerSideProps for looking up user profile by tag
  )

Page.getLayout = (children) => <HomeLayout header="">{children}</HomeLayout>

export default Page
