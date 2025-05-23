import { TopNav } from 'app/components/TopNav'
import { assetParam } from '../../../utils/assetParam'
import { WithdrawForm } from 'app/features/earn/withdraw/screen'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { HomeLayout } from 'app/features/home/layout.web'
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Withdraw Deposit</title>
      </Head>
      <SendEarnProvider>
        <WithdrawForm />
      </SendEarnProvider>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = (context) => {
  return assetParam(context, userProtectedGetSSP)
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Withdraw Deposit" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
