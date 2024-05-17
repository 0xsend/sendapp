import { SendScreen } from 'app/features/send/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { SendLayout } from 'app/features/send/layout.web'
import { SendTopNav } from 'app/features/send/components/SendTopNav'

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

export const getServerSideProps = userProtectedGetSSP(async () => {
  // disable for now
  return { redirect: { destination: '/', permanent: false } }
})

Page.getLayout = (children) => <SendLayout TopNav={<SendTopNav />}>{children}</SendLayout>

export default Page
