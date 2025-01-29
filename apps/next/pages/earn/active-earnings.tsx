import type { NextPageWithLayout } from '../_app'
import Head from 'next/head'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { ActiveEarnings } from 'app/features/earn/ActiveEarnings'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Active Earnings</title>
      </Head>
      <ActiveEarnings />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Active Earnings" backFunction="root" />}>
    {children}
  </HomeLayout>
)

export default Page
