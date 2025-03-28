import { HomeLayout } from '../../../../../packages/app/features/home/layout.web'
import { TopNav } from '../../../../../packages/app/components/TopNav'
import Head from 'next/head'
import { userProtectedGetSSP } from '../../../utils/userProtected'
import type { NextPageWithLayout } from '../../_app'
import { DepositFormScreen } from '../../../../../packages/app/features/deposit/form/screen'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Apple Pay Deposit</title>
      </Head>
      <DepositFormScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Apple Pay" backFunction="pop" />}>{children}</HomeLayout>
)

export default Page
