import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { DepositCoinbaseScreen } from 'app/features/deposit/coinbase/screen'

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

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Deposit" backFunction="pop" />}>{children}</HomeLayout>
)

export default Page
