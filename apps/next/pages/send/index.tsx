import { SendScreen } from 'app/features/send/screen'
import { NextSeo } from 'next-seo'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { SendTopNav } from 'app/features/send/components/SendTopNav'
import { HomeLayout } from 'app/features/home/layout.web'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <NextSeo title="Send" description="Send" />
      <SendScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => <HomeLayout TopNav={<SendTopNav />}>{children}</HomeLayout>

export default Page
