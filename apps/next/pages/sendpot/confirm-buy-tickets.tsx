import { HomeLayout } from 'app/features/home/layout.web'
import { ConfirmBuyTicketsScreen } from 'app/features/sendpot/ConfirmBuyTicketsScreen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Buy Tickets Summary</title>
      </Head>
      <ConfirmBuyTicketsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Buy Tickets Summary" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
