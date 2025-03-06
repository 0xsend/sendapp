import type { NextPageWithLayout } from '../_app'
import Head from 'next/head'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { DepositScreen } from 'app/features/earn/deposit/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Start Earning</title>
      </Head>
      <DepositScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Start Earning" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
