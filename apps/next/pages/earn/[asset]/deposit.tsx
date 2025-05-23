import { TopNav } from 'app/components/TopNav'
import { DepositScreen } from 'app/features/earn/deposit/screen'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { assetParam } from '../../../utils/assetParam'
import { HomeLayout } from 'app/features/home/layout.web'
import type { GetServerSideProps } from 'next'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Start Earning</title>
      </Head>
      <SendEarnProvider>
        <DepositScreen />
      </SendEarnProvider>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = (context) => {
  return assetParam(context, userProtectedGetSSP)
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Start Earning" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
