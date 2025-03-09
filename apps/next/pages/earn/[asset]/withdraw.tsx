import { TopNav } from 'app/components/TopNav'
import { WithdrawForm } from 'app/features/earn/WithdrawForm'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../../_app'

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

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Withdraw Deposit" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
