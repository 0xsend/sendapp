import { SendConfirmScreen } from 'app/features/send/confirm/screen'
import Head from 'next/head'
import { userProtectedGetSSP } from 'utils/userProtected'
import type { NextPageWithLayout } from '../_app'
import { SendLayout } from 'app/features/send/layout.web'
import { TopNav } from 'app/components/TopNav'

export const Page: NextPageWithLayout = () => {
  return (
    <>
      <Head>
        <title>Send | Confirm</title>
        <meta name="description" content="Send" key="desc" />
      </Head>
      <SendConfirmScreen />
    </>
  )
}

export const getServerSideProps = userProtectedGetSSP()

Page.getLayout = (children) => (
  <SendLayout TopNav={<TopNav header="Preview and Send" noSubroute />}>{children}</SendLayout>
)

export default Page
