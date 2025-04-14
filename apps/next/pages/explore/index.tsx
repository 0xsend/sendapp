import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { ExploreScreen } from 'app/features/explore/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Explore</title>
      </Head>
      <ExploreScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Explore" backFunction="router" />}>{children}</HomeLayout>
)

export default Page
