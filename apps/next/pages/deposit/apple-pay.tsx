import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import Head from 'next/head'
import type { NextPageWithLayout } from '../_app'
import { DepositCoinbaseScreen } from 'app/features/deposit/DepositCoinbase/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Apple Pay Deposit</title>
      </Head>
      <DepositCoinbaseScreen defaultPaymentMethod="APPLE_PAY" />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Apple Pay" backFunction="pop" />}>{children}</HomeLayout>
)

export default Page
