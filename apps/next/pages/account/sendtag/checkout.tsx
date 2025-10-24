import { CheckoutScreen } from 'app/features/account/sendtag/checkout/screen'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo
        title="Send | Sendtag Checkout"
        description="Sendtags simplify transactions by replacing long wallet addresses with memorable identifiers."
      />
      <CheckoutScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Sendtags" backFunction={'router'} />}>{children}</HomeLayout>
)

export default Page
