import { TopNav } from 'app/components/TopNav'
import { HomeLayout } from 'app/features/home/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { AccountScreenLayout } from 'app/features/account/AccountScreenLayout'
import { PAGE_TITLES, PAGE_DESCRIPTIONS } from 'utils/seoHelpers'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title={PAGE_TITLES.account} description={PAGE_DESCRIPTIONS.account} />
    </>
  )
}

Page.getLayout = () => (
  <HomeLayout
    TopNav={<TopNav header="Account" showOnGtLg={true} hideRightActions={true} />}
    fullHeight
  >
    <AccountScreenLayout />
  </HomeLayout>
)

export default Page
