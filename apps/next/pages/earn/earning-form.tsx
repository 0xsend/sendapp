import type { NextPageWithLayout } from '../_app'
import Head from 'next/head'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { EarningForm } from 'app/features/earn/EarningForm'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Start Earning</title>
      </Head>
      <EarningForm />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Start Earning" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
