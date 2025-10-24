import { BuyTicketsScreen } from 'app/features/sendpot/BuyTicketsScreen'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Buy Tickets" />
      <BuyTicketsScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Buy Tickets" backFunction="router" />}>{children}</HomeLayout>
)

export default Page
