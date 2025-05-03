import { TopNav } from 'app/components/TopNav'
import { ActiveEarningsScreen } from 'app/features/earn/active/screen'
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
        <title>Send | Savings Account</title>
      </Head>
      <ActiveEarningsScreen />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = (context) => {
  return assetParam(context, userProtectedGetSSP)
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Savings Account" backFunction="root" />}>
    {children}
  </HomeLayout>
)

export default Page
