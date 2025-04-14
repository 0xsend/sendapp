import { BuyTicketsScreen } from 'app/features/sendpot/BuyTicketsScreen'
import { HomeLayout } from 'app/features/home/layout.web'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Buy Tickets</title>
      </Head>
      <BuyTicketsScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Buy Tickets" backFunction="router" />}>{children}</HomeLayout>
)

export default Page
