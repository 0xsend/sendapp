import { SwapFormScreen } from '../../../../packages/app/features/swap/form/screen'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Trade" />
      <SwapFormScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <HomeLayout TopNav={<TopNav header="Trade" backFunction="router" />}>{children}</HomeLayout>
)

export default Page
