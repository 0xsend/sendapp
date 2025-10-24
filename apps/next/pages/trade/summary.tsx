import { SwapSummaryScreen } from '../../../../packages/app/features/swap/summary/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Trade Summary</title>
      </Head>
      <SwapSummaryScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Trade Summary" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
