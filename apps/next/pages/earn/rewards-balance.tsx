import type { NextPageWithLayout } from '../_app'
import Head from 'next/head'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { RewardsBalance } from 'app/features/earn/RewardsBalance'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Rewards Balance</title>
      </Head>
      <RewardsBalance />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Rewards Balance" backFunction="router" />} fullHeight>
    {children}
  </HomeLayout>
)

export default Page
