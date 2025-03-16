/*

TODO: add when rewards are live

import { TopNav } from 'app/components/TopNav'
import { RewardsBalance } from 'app/features/earn/rewards-balance/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import type { GetServerSideProps } from 'next'
import { assetParam } from '../../../utils/assetParam'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Rewards Balance</title>
      </Head>
      <RewardsBalance />
    </>
  )
}

export const getServerSideProps: GetServerSideProps = (context) => {
  return assetParam(context, userProtectedGetSSP)
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Rewards Balance" backFunction="router" />} fullHeight>
    {children}
  </HomeLayout>
)

export default Page

*/
