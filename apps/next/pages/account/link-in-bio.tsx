import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { AccountScreenLayout } from 'app/features/account/AccountScreenLayout'
import { LinkInBioScreen } from 'app/features/account/components/linkInBio/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Link In Bio</title>
        <meta name="description" content="Manage your social media links" key="desc" />
      </Head>
      <LinkInBioScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()
Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Account" backFunction={'router'} />} fullHeight>
    <AccountScreenLayout>{children}</AccountScreenLayout>
  </HomeLayout>
)

export default Page
