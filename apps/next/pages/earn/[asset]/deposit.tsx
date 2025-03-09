import { TopNav } from 'app/components/TopNav'
import { DepositScreen } from 'app/features/earn/deposit/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Start Earning</title>
      </Head>
      <DepositScreen />
    </>
  )
}
export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Start Earning" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
