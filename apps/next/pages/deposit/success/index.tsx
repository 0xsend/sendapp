import Head from 'next/head'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { SuccessScreen } from 'app/features/deposit/components/SuccessScreen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Deposit</title>
      </Head>
      <SuccessScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Deposit" backFunction="home" />}>{children}</HomeLayout>
)

export default Page
