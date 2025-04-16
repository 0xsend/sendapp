import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { InvestScreen } from 'app/features/invest/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Invest</title>
      </Head>
      <InvestScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Invest" backFunction="router" showOnGtLg={true} />}>
    {children}
  </HomeLayout>
)

export default Page
