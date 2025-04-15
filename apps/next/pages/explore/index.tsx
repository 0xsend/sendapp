import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
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

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Explore" backFunction="router" showOnGtLg={true} />}>
    {children}
  </HomeLayout>
)

export default Page
