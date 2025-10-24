import { SendScreen } from 'app/features/send/screen'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { SendTopNav } from 'app/features/send/components/SendTopNav'
import { HomeLayout } from 'app/features/home/layout.web'
import { PAGE_TITLES, PAGE_DESCRIPTIONS } from 'utils/seoHelpers'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title={PAGE_TITLES.send} description={PAGE_DESCRIPTIONS.send} />
      <SendScreen />
    </>
  )
}

Page.getLayout = (children) => <HomeLayout TopNav={<SendTopNav />}>{children}</HomeLayout>

export default Page
