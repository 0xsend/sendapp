import { SwapSummaryScreen } from '../../../../packages/app/features/swap/summary/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Swap Summary</title>
      </Head>
      <SwapSummaryScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Swap Summary" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
