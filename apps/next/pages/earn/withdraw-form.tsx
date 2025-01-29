import type { NextPageWithLayout } from '../_app'
import Head from 'next/head'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { WithdrawForm } from 'app/features/earn/WithdrawForm'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Withdraw Deposit</title>
      </Head>
      <WithdrawForm />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Withdraw Deposit" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
