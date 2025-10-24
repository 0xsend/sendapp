import { HomeLayout } from 'app/features/home/layout.web'
import { ConfirmBuyTicketsScreen } from 'app/features/sendpot/ConfirmBuyTicketsScreen'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Buy Tickets Summary" />
      <ConfirmBuyTicketsScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Buy Tickets Summary" backFunction="router" />}>
    {children}
  </HomeLayout>
)

export default Page
