import { SendScreen } from 'app/features/send/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { SendTopNav } from 'app/features/send/components/SendTopNav'
import { HomeLayout } from 'app/features/home/layout.web'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send</title>
        <meta name="description" content="Send" key="desc" />
      </Head>
      <SendScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => <HomeLayout TopNav={<SendTopNav />}>{children}</HomeLayout>

export default Page
