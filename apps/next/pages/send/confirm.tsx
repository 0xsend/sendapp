import { SendConfirmScreen } from 'app/features/send/confirm/screen'
import { NextSeo } from 'next-seo'
import type { NextPageWithLayout } from '../_app'
import { HomeLayout } from 'app/features/home/layout.web'
import { SendTopNav } from 'app/features/send/components/SendTopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send | Confirm" description="Send" />
      <SendConfirmScreen />
    </>
  )
}

Page.getLayout = (children) => <HomeLayout TopNav={<SendTopNav />}>{children}</HomeLayout>

export default Page
