import { TopNav } from 'app/components/TopNav'
import { EarningsBalance } from 'app/features/earn/earnings/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Earnings Balance</title>
      </Head>
      <EarningsBalance />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Earnings Balance" backFunction="router" />} fullHeight>
    {children}
  </HomeLayout>
)

export default Page
