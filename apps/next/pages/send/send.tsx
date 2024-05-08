import { SendScreen } from 'app/features/send/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { SendLayout } from 'app/features/send/layout.web'
import { TopNav } from 'app/components/TopNav'

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

Page.getLayout = (children) => (
  <SendLayout TopNav={<TopNav header="Enter Amount" noSubroute />}>{children}</SendLayout>
)

export default Page
