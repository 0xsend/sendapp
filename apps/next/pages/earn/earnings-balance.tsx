import type { NextPageWithLayout } from '../_app'
import Head from 'next/head'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { EarningsBalance } from 'app/features/earn/EarningsBalance'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Earnings Balance</title>
      </Head>
      <EarningsBalance />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Earnings Balance" backFunction="router" />} fullHeight>
    {children}
  </HomeLayout>
)

export default Page
