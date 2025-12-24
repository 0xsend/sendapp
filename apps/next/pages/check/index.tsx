import { CheckScreen } from 'app/features/check/screen'
import { CheckLayout } from 'app/features/check/layout.web'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | My Checks" description="View and manage your Send Checks" />
      <CheckScreen />
    </>
  )
}

Page.getLayout = (children) => (
  <CheckLayout TopNav={<TopNav header="My Checks" backHref="/send" showOnGtLg showBackOnDesktop />}>
    {children}
  </CheckLayout>
)

export default Page
