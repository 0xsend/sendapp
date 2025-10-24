import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'
import { EarnScreen } from 'app/features/earn/screen'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Earn" />
      <SendEarnProvider>
        <EarnScreen />
      </SendEarnProvider>
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Earn" backFunction="router" />}>{children}</HomeLayout>
)

export default Page
